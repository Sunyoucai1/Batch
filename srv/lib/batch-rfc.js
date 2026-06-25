const RfcClient = require('node-rfc').Client;

async function createBatch(rfcCredentials, material, plant) {
  const client = new RfcClient(rfcCredentials);
  await client.open();
  try {
    const result = await client.call('BAPI_BATCH_CREATE', {
      MATERIAL: material.padEnd(18),
      PLANT: plant.padEnd(4),
      BATCH_CLASS: '',
    });
    if (result.RETURN && result.RETURN.some(m => ['E', 'A'].includes(m.TYPE))) {
      const errors = result.RETURN.filter(m => ['E', 'A'].includes(m.TYPE)).map(m => m.MESSAGE).join('; ');
      throw new Error(`BAPI_BATCH_CREATE failed: ${errors}`);
    }
    const commitResult = await client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });
    if (commitResult.RETURN && commitResult.RETURN.some(m => ['E', 'A'].includes(m.TYPE))) {
      const errors = commitResult.RETURN.filter(m => ['E', 'A'].includes(m.TYPE)).map(m => m.MESSAGE).join('; ');
      throw new Error(`BAPI_TRANSACTION_COMMIT failed: ${errors}`);
    }
    return result.BATCH;
  } finally {
    await client.close();
  }
}

async function updateBatchCharacteristics(rfcCredentials, batch, material, plant, weightedAvg) {
  const client = new RfcClient(rfcCredentials);
  await client.open();
  try {
    const characteristics = Object.entries(weightedAvg).map(([name, value]) => ({
      CHARAC: name.padEnd(30),
      VALUE_CHAR: String(value).padEnd(70),
    }));
    const result = await client.call('BAPI_BATCH_CHANGE', {
      MATERIAL: material.padEnd(18),
      PLANT: plant.padEnd(4),
      BATCH: batch.padEnd(10),
      CLASSIF: characteristics,
    });
    if (result.RETURN && result.RETURN.some(m => ['E', 'A'].includes(m.TYPE))) {
      const errors = result.RETURN.filter(m => ['E', 'A'].includes(m.TYPE)).map(m => m.MESSAGE).join('; ');
      throw new Error(`BAPI_BATCH_CHANGE failed: ${errors}`);
    }
    const commitResult = await client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });
    if (commitResult.RETURN && commitResult.RETURN.some(m => ['E', 'A'].includes(m.TYPE))) {
      const errors = commitResult.RETURN.filter(m => ['E', 'A'].includes(m.TYPE)).map(m => m.MESSAGE).join('; ');
      throw new Error(`BAPI_TRANSACTION_COMMIT failed: ${errors}`);
    }
  } finally {
    await client.close();
  }
}

async function createMaterialDocument(rfcCredentials, subItems, newBatch, plant) {
  // MT344: batch-to-batch transfer posting (no physical movement)
  const client = new RfcClient(rfcCredentials);
  await client.open();
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const gmItems = subItems.map(item => ({
      MATERIAL:      item.material.padEnd(18),
      PLANT:         plant.padEnd(4),
      STGE_LOC:      (item.storageLocation || '').padEnd(4),
      BATCH:         item.batch.padEnd(10),
      ENTRY_QNT:     String(item.qty),
      ENTRY_UOM:     'TO',
      MOVE_TYPE:     '344',
      // TODO: Verify correct field for destination batch in MT344 — VENDOR_BATCH vs BATCH_NEW
      // needs confirmation against actual BAPI_GOODSMVT_CREATE parameter structure on S/4HANA PCE
      VENDOR_BATCH:  newBatch.padEnd(10),
    }));

    const result = await client.call('BAPI_GOODSMVT_CREATE', {
      GOODSMVT_HEADER: {
        PSTNG_DATE: today,
        DOC_DATE:   today,
      },
      GOODSMVT_CODE: { GM_CODE: '04' },
      GOODSMVT_ITEM: gmItems,
    });

    if (result.RETURN && result.RETURN.some(m => ['E', 'A'].includes(m.TYPE))) {
      const errors = result.RETURN.filter(m => ['E', 'A'].includes(m.TYPE)).map(m => m.MESSAGE).join('; ');
      throw new Error(`BAPI_GOODSMVT_CREATE failed: ${errors}`);
    }
    const commitResult = await client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });
    if (commitResult.RETURN && commitResult.RETURN.some(m => ['E', 'A'].includes(m.TYPE))) {
      const errors = commitResult.RETURN.filter(m => ['E', 'A'].includes(m.TYPE)).map(m => m.MESSAGE).join('; ');
      throw new Error(`BAPI_TRANSACTION_COMMIT failed: ${errors}`);
    }
    return result.MATERIALDOCUMENT;
  } finally {
    await client.close();
  }
}

module.exports = { createBatch, updateBatchCharacteristics, createMaterialDocument };
