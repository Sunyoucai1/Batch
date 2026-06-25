const cds = require('@sap/cds');

describe('DeliveryService merge action', () => {
  const { GET, POST, axios } = cds.test(__dirname + '/..');

  let srv;

  beforeAll(async () => {
    srv = await cds.connect.to('DeliveryService');
  });

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

    await expect(
      srv.send('merge', {
        DeliveryDocument: '8022975770',
        DeliveryDocumentItem: '000010'
      })
    ).rejects.toThrow('already been merged');
  });
});
