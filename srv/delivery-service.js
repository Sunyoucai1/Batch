const cds = require('@sap/cds');
const { calculateWeightedAverage } = require('./lib/weighted-average');

// Lazy-loaded: node-rfc requires the SAP RFC SDK native binary, which is only
// available on production hosts. Loading it lazily means tests can boot the
// service and exercise non-RFC paths (e.g. pre-checks) without the SDK.
let _batchRfc;
function getBatchRfc() {
  if (!_batchRfc) _batchRfc = require('./lib/batch-rfc');
  return _batchRfc;
}

const CHARC_NAMES = ['WMT', 'DMT', 'CU', 'AU', 'AG'];
const SPLIT_ITEM_CATEGORY = 'ZTA1';

module.exports = class DeliveryService extends cds.ApplicationService {
  async init() {
    this.on('merge', async (req) => {
      const { DeliveryDocument, DeliveryDocumentItem } = req.data;

      // Resolve db immediately; odApi is deferred until after pre-checks so that
      // tests without a live S/4HANA backend can exercise the "already MERGED" guard.
      const db = await cds.connect.to('db');

      // Step 0: Pre-checks (db only — no external service needed)
      const alreadyMerged = await this._checkNotAlreadyMerged(db, DeliveryDocument, DeliveryDocumentItem);
      if (alreadyMerged) return req.error(409, alreadyMerged);

      // Resolve the external OData service only after pre-checks pass
      const odApi = await cds.connect.to('API_OUTBOUND_DELIVERY_SRV');
      const subItems = await this._getSubItems(odApi, DeliveryDocument, DeliveryDocumentItem);
      if (subItems.length < 2) {
        return req.error(400, `OD ${DeliveryDocument} item ${DeliveryDocumentItem} has ${subItems.length} batch split(s) — merge not required`);
      }

      // Step 1: Calculate weighted averages using WMT (qty) as weight basis
      const batchSplits = this._mapSubItemsToBatchSplits(subItems);
      const weightedAvg = this._computeWeightedAverages(batchSplits);
      const totalQty = batchSplits.reduce((sum, b) => sum + b.qty, 0);

      const material = subItems[0].Material;
      const plant = subItems[0].Plant;
      const rfcCredentials = this._getRfcCredentials();

      let newBatch;
      try {
        // Step 2: Create new Delivery Batch via BAPI_BATCH_CREATE + COMMIT
        const { createBatch, updateBatchCharacteristics, createMaterialDocument } = getBatchRfc();
        newBatch = await createBatch(rfcCredentials, material, plant);

        // Step 3: Write weighted average characteristics via BAPI_BATCH_CHANGE + COMMIT
        await updateBatchCharacteristics(rfcCredentials, newBatch, material, plant, weightedAvg);

        // Step 4: Create batch-to-batch material movement (MT344) for inventory consistency
        const splitItemsForRfc = subItems.map(item => ({
          material: item.Material,
          batch: item.Batch,
          qty: parseFloat(item.ActualDeliveryQuantity),
          storageLocation: item.StorageLocation || '',
        }));
        await createMaterialDocument(rfcCredentials, splitItemsForRfc, newBatch, plant);

        // Step 5: Update OD Item to point to new delivery batch
        await this._updateODItem(odApi, DeliveryDocument, DeliveryDocumentItem, newBatch, totalQty);

        // Step 6: Record success
        await this._saveMergeLog(db, DeliveryDocument, DeliveryDocumentItem, 'MERGED', newBatch, null);

        return { NewBatch: newBatch, Message: `Batch merge successful. New delivery batch: ${newBatch}` };

      } catch (err) {
        await this._saveMergeLog(db, DeliveryDocument, DeliveryDocumentItem, 'FAILED', newBatch || null, err.message);
        return req.error(500, `Merge failed: ${err.message}. New batch (if created): ${newBatch || 'none'}. Please clean up manually in S/4HANA (MSC2N).`);
      }
    });

    return super.init();
  }

  async _checkNotAlreadyMerged(db, deliveryDocument, deliveryDocumentItem) {
    const existing = await db.run(
      SELECT.one.from('rio.batchmerge.MergeLog')
        .where({ DeliveryDocument: deliveryDocument, DeliveryDocumentItem: deliveryDocumentItem, MergeStatus: 'MERGED' })
    );
    if (existing) return `OD ${deliveryDocument} item ${deliveryDocumentItem} has already been merged. New batch: ${existing.NewBatch}`;
    return null;
  }

  async _getSubItems(odApi, deliveryDocument, deliveryDocumentItem) {
    return odApi.run(
      SELECT.from('API_OUTBOUND_DELIVERY_SRV.A_OutbDeliveryItem')
        .where({
          DeliveryDocument: deliveryDocument,
          DeliveryDocumentItemCategory: SPLIT_ITEM_CATEGORY
        })
    );
  }

  _mapSubItemsToBatchSplits(subItems) {
    return subItems.map(item => ({
      qty: parseFloat(item.ActualDeliveryQuantity),
      batch: item.Batch,
      material: item.Material,
      plant: item.Plant,
      characteristics: {
        WMT: parseFloat(item.ActualDeliveryQuantity),
      }
    }));
  }

  _computeWeightedAverages(batchSplits) {
    const result = {};
    CHARC_NAMES.forEach(name => {
      try {
        result[name] = calculateWeightedAverage(batchSplits, name);
      } catch {
        // characteristic not present on these batches — skip
      }
    });
    return result;
  }

  async _updateODItem(odApi, deliveryDocument, deliveryDocumentItem, newBatch, totalQty) {
    await odApi.run(
      UPDATE('API_OUTBOUND_DELIVERY_SRV.A_OutbDeliveryItem')
        .set({ Batch: newBatch, ActualDeliveryQuantity: String(totalQty) })
        .where({ DeliveryDocument: deliveryDocument, DeliveryDocumentItem: deliveryDocumentItem })
    );
  }

  _getRfcCredentials() {
    const env = cds.env.requires && cds.env.requires.S4HANA_RFC;
    if (env && env.credentials) return env.credentials;
    if (process.env.RFC_CREDENTIALS) return JSON.parse(process.env.RFC_CREDENTIALS);
    return { dest: 'S4HANA_PCE_RFC' };
  }

  async _saveMergeLog(db, deliveryDocument, deliveryDocumentItem, status, newBatch, errorMessage) {
    const existing = await db.run(
      SELECT.one.from('rio.batchmerge.MergeLog')
        .where({ DeliveryDocument: deliveryDocument, DeliveryDocumentItem: deliveryDocumentItem })
    );
    if (existing) {
      await db.run(
        UPDATE('rio.batchmerge.MergeLog')
          .set({ MergeStatus: status, NewBatch: newBatch, ErrorMessage: errorMessage })
          .where({ ID: existing.ID })
      );
    } else {
      await db.run(
        INSERT.into('rio.batchmerge.MergeLog').entries({
          ID: cds.utils.uuid(),
          DeliveryDocument: deliveryDocument,
          DeliveryDocumentItem: deliveryDocumentItem,
          MergeStatus: status,
          NewBatch: newBatch,
          ErrorMessage: errorMessage,
        })
      );
    }
  }
};
