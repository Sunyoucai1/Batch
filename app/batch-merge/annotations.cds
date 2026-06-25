using DeliveryService from '../../srv/delivery-service';

// ── List Report: OutboundDeliveries ──────────────────────────────
annotate DeliveryService.OutboundDeliveries with @(
  UI.LineItem: [
    { Value: DeliveryDocument,  Label: 'OD Number'   },
    { Value: ShipToParty,       Label: 'Ship-To'     },
    { Value: TotalWeight,       Label: 'Total Weight' },
    { Value: WeightUnit,        Label: 'Unit'         },
    { $Type: 'UI.DataFieldForAction',
      Action: 'DeliveryService.merge',
      Label:  'Merge Batch'
    }
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
      Label:  'Batch Splits',
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
    { Value: DeliveryDocumentItem, Label: 'Sub-Item'  },
    { Value: Batch,                Label: 'Batch'     },
    { Value: DeliveryQuantity,     Label: 'Qty'       },
    { Value: ItemCategory,         Label: 'Category'  }
  ]
);
