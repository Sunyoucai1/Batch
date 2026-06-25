const cds = require('@sap/cds');

describe('DeliveryService merge action', () => {
  cds.test(__dirname + '/..');

  test('returns error when already MERGED', async () => {
    const db = await cds.connect.to('db');
    await db.run(
      INSERT.into('rio.batchmerge.MergeLog').entries({
        ID: cds.utils.uuid(),
        DeliveryDocument: '8022975770',
        DeliveryDocumentItem: '000010',
        MergeStatus: 'MERGED',
        NewBatch: 'TEST001'
      })
    );

    const srv = await cds.connect.to('DeliveryService');
    const response = await srv.send('merge', {
      DeliveryDocument: '8022975770',
      DeliveryDocumentItem: '000010'
    }).catch(e => e);

    expect(response.message || response).toMatch(/already been merged/);
  });
});
