using { API_OUTBOUND_DELIVERY_SRV as OD } from './external/API_OUTBOUND_DELIVERY_SRV';

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
  // MergeStatus is derived: PENDING (>=2 ZTA1 sub-items), MERGED (single Batch, no sub-items)
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

  // Merge action — orchestrates RFC BAPI calls for batch create/update
  action merge(
    DeliveryDocument     : String(10),
    DeliveryDocumentItem : String(6)
  ) returns {
    NewBatch   : String(10);
    Message    : String(200);
  };
}
