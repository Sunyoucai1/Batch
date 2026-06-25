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
    if (result.RETURN && result.RETURN.some(m => m.TYPE === 'E')) {
      const errors = result.RETURN.filter(m => m.TYPE === 'E').map(m => m.MESSAGE).join('; ');
      throw new Error(`BAPI_BATCH_CREATE failed: ${errors}`);
    }
    await client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });
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
    if (result.RETURN && result.RETURN.some(m => m.TYPE === 'E')) {
      const errors = result.RETURN.filter(m => m.TYPE === 'E').map(m => m.MESSAGE).join('; ');
      throw new Error(`BAPI_BATCH_CHANGE failed: ${errors}`);
    }
    await client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });
  } finally {
    await client.close();
  }
}

async function createMaterialDocument(rfcCredentials, subItems, newBatch, plant) {
  // MT344: batch-to-batch transfer posting (no physical movement)
  const client = new RfcClient(rfcCredentials);
  await client.open();
  try {
    const gmItems = subItems.map(item => ({
      MATERIAL:      item.material.padEnd(18),
      PLANT:         plant.padEnd(4),
      STGE_LOC:      (item.storageLocation || '').padEnd(4),
      BATCH:         item.batch.padEnd(10),
      ENTRY_QNT:     String(item.qty),
      ENTRY_UOM:     'TO',
      MOVE_TYPE:     '344',
      VENDOR_BATCH:  newBatch.padEnd(10),
    }));

    const result = await client.call('BAPI_GOODSMVT_CREATE', {
      GOODSMVT_HEADER: {
        PSTNG_DATE: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        DOC_DATE:   new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      },
      GOODSMVT_CODE: { GM_CODE: '04' },
      GOODSMVT_ITEM: gmItems,
    });

    if (result.RETURN && result.RETURN.some(m => m.TYPE === 'E')) {
      const errors = result.RETURN.filter(m => m.TYPE === 'E').map(m => m.MESSAGE).join('; ');
      throw new Error(`BAPI_GOODSMVT_CREATE failed: ${errors}`);
    }
    await client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });
    return result.MATERIALDOCUMENT;
  } finally {
    await client.close();
  }
}

module.exports = { createBatch, updateBatchCharacteristics, createMaterialDocument };
