namespace rio.batchmerge;

entity MergeLog {
  key ID                   : UUID;
      DeliveryDocument     : String(10);
      DeliveryDocumentItem : String(6);
      MergeStatus          : String(20);  // PENDING | MERGED | FAILED
      NewBatch             : String(10);
      ErrorMessage         : String(500);
      CreatedAt            : Timestamp;
      CreatedBy            : String(50);
}
