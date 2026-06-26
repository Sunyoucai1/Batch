using DeliveryService from '../../srv/delivery-service';

// ── List Report: OutboundDeliveries ──────────────────────────────
annotate DeliveryService.OutboundDeliveries with @(
  UI.LineItem: [
    { Value: DeliveryDocument,  Label: 'OD Number'    },
    { Value: ShipToParty,       Label: 'Ship-To'      },
    { Value: DocumentDate,      Label: 'Document Date' },
    { Value: TotalWeight,       Label: 'Total Weight'  },
    { Value: WeightUnit,        Label: 'Unit'          }
  ],
  UI.SelectionFields: [ DeliveryDocument, ShipToParty ],
  UI.HeaderInfo: {
    TypeName:       'Outbound Delivery',
    TypeNamePlural: 'Outbound Deliveries',
    Title: { Value: DeliveryDocument }
  }
);

// ── Object Page: OD Detail ───────────────────────────────────────
annotate DeliveryService.OutboundDeliveries with @(
  UI.Facets: [
    {
      $Type:  'UI.ReferenceFacet',
      Label:  'General Info',
      Target: '@UI.FieldGroup#General'
    },
    {
      $Type:  'UI.ReferenceFacet',
      Label:  'Delivery Items',
      Target: 'DeliveryItems/@UI.LineItem'
    }
  ],
  UI.FieldGroup#General: {
    Data: [
      { Value: DeliveryDocument },
      { Value: ShipToParty      },
      { Value: DocumentDate     },
      { Value: TotalWeight      },
      { Value: WeightUnit       }
    ]
  }
);

// ── DeliveryItems table on Object Page ───────────────────────────
annotate DeliveryService.DeliveryItems with @(
  UI.LineItem: [
    { Value: DeliveryDocumentItem, Label: 'Item'      },
    { Value: Material,             Label: 'Material'  },
    { Value: DeliveryQuantity,     Label: 'Qty'       },
    { Value: Batch,                Label: 'Batch'     },
    { Value: ItemCategory,         Label: 'Category'  },
    {
      $Type:  'UI.DataFieldForAction',
      Action: 'DeliveryService.merge',
      Label:  'Merge Batch'
    }
  ]
);
