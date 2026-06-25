const cds = require('@sap/cds');

describe('DeliveryService merge action', () => {
  cds.test(__dirname + '/..');

  test('returns 400 when OD has only 1 batch split', async () => {
    const srv = await cds.connect.to('DeliveryService');

    // Stub _getSubItems to return 1 sub-item without touching S/4HANA
    const original = srv._getSubItems.bind(srv);
    srv._getSubItems = async () => ([{
      DeliveryDocument: '8000000001',
      DeliveryDocumentItem: '000900',
      Material: '70302166',
      Plant: '3010',
      ActualDeliveryQuantity: 642.42,
      Batch: '1000014620',
      DeliveryDocumentItemCategory: 'ZTA1'
    }]);

    const response = await srv.send('merge', {
      DeliveryDocument: '8000000001',
      DeliveryDocumentItem: '000010'
    }).catch(e => e);

    srv._getSubItems = original;
    expect(response.message || String(response)).toMatch(/only 1 batch split/);
  });

  test('returns 409 when OD has no ZTA1 sub-items (already merged)', async () => {
    const srv = await cds.connect.to('DeliveryService');

    // Stub _getSubItems to return empty array — simulates already-merged OD
    const original = srv._getSubItems.bind(srv);
    srv._getSubItems = async () => ([]);

    const response = await srv.send('merge', {
      DeliveryDocument: '8000000099',
      DeliveryDocumentItem: '000010'
    }).catch(e => e);

    srv._getSubItems = original;
    expect(response.message || String(response)).toMatch(/already merged or merge not required/);
  });
});
