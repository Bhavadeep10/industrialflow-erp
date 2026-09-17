# IndustrialFlow ERP - ER Diagram

```mermaid
erDiagram

    USER {
        int id PK
        string name
        string email UK
        string passwordHash
        string role
        boolean isActive
    }

    CUSTOMER {
        int id PK
        string companyName
        string contactPerson
        string mobile
        string email
        string city
    }

    PRODUCT {
        int id PK
        string productCode UK
        string productName
        string category
        string unit
        decimal basePrice
    }

    INVENTORY {
    int id PK
    int productId FK
    int physicalQuantity
    int reservedQuantity
    }

    ENQUIRY {
        int id PK
        string enquiryNumber UK
        int customerId FK
        int createdById FK
        date enquiryDate
        date requiredDate
        string status
    }

    ENQUIRY_ITEM {
        int id PK
        int enquiryId FK
        int productId FK
        int quantity
    }

    QUOTATION {
        int id PK
        string quotationNumber UK
        int enquiryId FK
        int customerId FK
        int createdById FK
        date validUntil
        string status
        decimal grandTotal
    }

    QUOTATION_ITEM {
        int id PK
        int quotationId FK
        int productId FK
        int quantity
        decimal unitPrice
        decimal discountPct
        decimal gstPct
        decimal lineAmount
    }

    SALES_ORDER {
        int id PK
        string orderNumber UK
        int customerId FK
        int quotationId FK
        date orderDate
        decimal totalAmount
        string status
    }

    SALES_ORDER_ITEM {
        int id PK
        int salesOrderId FK
        int productId FK
        int quantity
    }

    DISPATCH {
        int id PK
        string dispatchNumber UK
        int salesOrderId FK
        date dispatchDate
        string vehicleNumber
        string driverName
    }

    DISPATCH_ITEM {
        int id PK
        int dispatchId FK
        int productId FK
        int quantity
    }


    USER ||--o{ ENQUIRY : creates
    USER ||--o{ QUOTATION : creates

    CUSTOMER ||--o{ ENQUIRY : has
    CUSTOMER ||--o{ QUOTATION : receives
    CUSTOMER ||--o{ SALES_ORDER : places

    ENQUIRY ||--o{ ENQUIRY_ITEM : contains
    PRODUCT ||--o{ ENQUIRY_ITEM : requested

    ENQUIRY ||--o{ QUOTATION : generates
    QUOTATION ||--o{ QUOTATION_ITEM : contains
    PRODUCT ||--o{ QUOTATION_ITEM : included

    QUOTATION ||--o| SALES_ORDER : converts_to
    SALES_ORDER ||--o{ SALES_ORDER_ITEM : contains
    PRODUCT ||--o{ SALES_ORDER_ITEM : ordered

    PRODUCT ||--o| INVENTORY : has

    SALES_ORDER ||--o{ DISPATCH : has
    DISPATCH ||--o{ DISPATCH_ITEM : contains
    PRODUCT ||--o{ DISPATCH_ITEM : dispatched