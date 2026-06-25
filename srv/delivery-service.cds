using { API_OUTBOUND_DELIVERY_SRV as OD } from './external/API_OUTBOUND_DELIVERY_SRV';
using { rio.batchmerge as db } from '../db/merge-status';

service DeliveryService @(path: '/delivery') {

  // Outbound Delivery headers — read from S/4HANA via OData
  @readonly
  entity OutboundDeliveries as projection on OD.A_OutbDeliveryHeader {
    DeliveryDocument,
    ShipToParty,
    DocumentDate,
    TotalWeight,
    WeightUnit
  };

  // Outbound Delivery Items — read from S/4HANA via OData
  @readonly
  entity DeliveryItems as projection on OD.A_OutbDeliveryItem {
    DeliveryDocument,
    DeliveryDocumentItem,
    Material,
    Plant,
    ActualDeliveryQuantity as DeliveryQuantity,
    Batch,
    DeliveryDocumentItemCategory as ItemCategory
  };

  // Local merge log — read/write in HANA
  entity MergeLog as projection on db.MergeLog;

  // Merge action — orchestrates RFC BAPI calls for batch create/update
  action merge(
    DeliveryDocument     : String(10),
    DeliveryDocumentItem : String(6)
  ) returns {
    NewBatch   : String(10);
    Message    : String(200);
  };
}
