# BTP Destination Configuration Guide
# Task 8 — CALM 3-2445 Batch Merge App

## 1. HTTP Destination (for OData API)

Configure in: BTP Subaccount → Connectivity → Destinations

| Field | Value |
|-------|-------|
| Name | S4HANA_PCE_HTTP |
| Type | HTTP |
| URL | https://\<your-s4hana-virtual-host\> |
| Proxy Type | OnPremise |
| Authentication | BasicAuthentication |
| User | \<technical user\> |
| Password | \<password\> |

Additional Properties:
- `sap-client` = \<client e.g. 100\>
- `WebIDEEnabled` = true

## 2. RFC Destination (for BAPI calls)

Configure in: BTP Subaccount → Connectivity → Destinations

| Field | Value |
|-------|-------|
| Name | S4HANA_PCE_RFC |
| Type | RFC |
| Proxy Type | OnPremise |
| Authentication | BasicAuthentication |
| User | \<technical user\> |
| Password | \<password\> |

Additional Properties:
- `jco.client.client` = \<client e.g. 100\>
- `jco.client.sysnr` = \<system number e.g. 00\>
- `jco.client.r3name` = \<S/4HANA system ID e.g. PCE\>

## 3. Cloud Connector Mappings

Configure in: SAP Cloud Connector Administration

### HTTP Mapping
- Virtual host → internal S/4HANA host:443
- Resources: `/sap/opu/odata/sap/OP_API_OUTBOUND_DELIVERY_SRV_0002`

### RFC Mapping
- Virtual host → internal S/4HANA host:sapgw\<sysnr\>
- Function Modules allowed:
  - BAPI_BATCH_CREATE
  - BAPI_BATCH_CHANGE
  - BAPI_GOODSMVT_CREATE
  - BAPI_TRANSACTION_COMMIT
