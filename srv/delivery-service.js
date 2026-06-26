const cds = require('@sap/cds');

module.exports = class DeliveryService extends cds.ApplicationService {
  async init() {
    this.on('merge', async (req) => {
      const { DeliveryDocument, DeliveryDocumentItem } = req.data;

      // TODO: Replace with RAP OData Action call once backend is ready
      // RAP endpoint: POST /sap/opu/odata4/.../ZBatchMerge_SB/.../DeliveryItem(...)/merge
      return {
        NewBatch: `STUB-${DeliveryDocument}-${DeliveryDocumentItem}`,
        Message: '[STUB] Pending RAP backend implementation'
      };
    });

    return super.init();
  }

  async _odApi() {
    return cds.connect.to('API_OUTBOUND_DELIVERY_SRV');
  }
};
