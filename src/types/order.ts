// Basic types
interface TimeRange {
  start_time: string;
  end_time: string;
}

interface Amount {
  amount_e5: number;
  currency_code: string;
  formatted: string;
}

interface MoneyDetail {
  display_amount: string;
  net: Amount;
  tax: Amount;
  gross: Amount;
  is_tax_inclusive: boolean;
}

// Store related types
interface PartnerIdentifier {
  id: string;
  type: string;
}

interface Store {
  id: string;
  name: string;
  partner_identifiers: PartnerIdentifier[];
}

// Customer related types
interface CustomerName {
  display_name: string;
  first_name: string;
  last_name: string;
}

interface Phone {
  number: string;
  pin_code: string;
  country_iso2: string;
}

interface EncryptedTaxId {
  key: string;
  cipher_text: string;
}

interface TaxProfile {
  tax_ids: string;
  tax_id_type: string;
  customer_full_name: string;
  email: string;
  legal_entity_name: string;
  billing_address: string;
  country: string;
  encrypted_tax_id: EncryptedTaxId;
}

interface Customer {
  id: string;
  name: CustomerName;
  order_history: {
    past_order_count: number;
  };
  contact: {
    phone: Phone;
  };
  is_primary_customer: boolean;
  tax_profile: TaxProfile;
  can_respond_to_fulfillment_issues: boolean;
}

// Delivery related types
interface Vehicle {
  type: string;
  make: string;
  model: string;
  color: string;
  license_plate: string;
  is_autonomous: boolean;
  handoff_instructions: string;
  passcode: string;
}

interface Location {
  type: string;
  id: string;
  street_address_line_one: string;
  street_address_line_two?: string;
  latitude: string;
  longitude: string;
  unit_number: number;
  business_name: string;
  city: string;
  country: string;
  postal_code: string;
  location_type_value: string;
  client_provided_street_address_line_one?: string;
}

interface DeliveryPartner {
  id: string;
  name: string;
  vehicle: Vehicle;
  picture_url: string;
  contact: {
    phone: Phone;
  };
  current_location: {
    latitude: number;
    longitude: number;
  };
}

interface Delivery {
  id: string;
  delivery_partner: DeliveryPartner;
  status: string;
  location: Location;
  estimated_pick_up_time: string;
  interaction_type: string;
  delivery_partner_marked_not_ready_time: string;
  instructions: string;
}

// Cart related types
interface CartItem {
  id: string;
  cart_item_id: string;
  customer_id: string;
  title: string;
  external_data: string;
  quantity: {
    amount: number;
    unit?: string;
    in_sellable_unit?: any;
    in_priceable_unit?: any;
  };
  default_quantity: {
    amount: number;
    unit: string;
  };
  customer_requests?: {
    allergy?: {
      allergens: string[];
      instructions: string;
    };
    special_instructions?: string;
  };
  selected_modifier_groups?: any[];
  picture_url?: string;
  fulfillment_action?: {
    action_type: string;
    item_substitutes: Array<{
      id: string;
      title: string;
    }>;
  };
}

interface Cart {
  id: string;
  items: CartItem[];
  fulfillment_issues?: any[];
  special_instructions?: string;
  include_single_use_items: boolean;
  revision_id: string;
  restricted_items: {
    alcohol: {
      contain_alcoholic_item: boolean;
    };
    tobacco: {
      contain_tobacco_product: boolean;
    };
  };
}

// Main Order interface
export interface Order {
  id: string;
  display_id: string;
  external_id: string;
  state: string;
  status: string;
  preparation_status: string;
  ordering_platform: string;
  fulfillment_type: string;
  scheduled_order_target_delivery_time_range: TimeRange;
  store: Store;
  customers: Customer[];
  deliveries: Delivery[];
  carts: Cart[];
  payment: {
    payment_detail: {
      order_total: MoneyDetail;
      item_charges: any; // Detailed structure omitted for brevity
      fees: any;
      tips: any;
      promotions: any;
      adjustment: any;
      currency_code: string;
      cash_amount_due: MoneyDetail;
    };
    tax_reporting: any; // Detailed structure omitted for brevity
  };
  is_order_accuracy_risk: boolean;
  store_instructions: string;
  preparation_time: {
    ready_for_pickup_time_secs: number;
    source: string;
    ready_for_pickup_time: string;
  };
  completed_time: string;
  eligible_actions: {
    adjust_ready_for_pickup_time: { is_eligible: boolean; reason: string };
    mark_out_of_item: { is_eligible: boolean; reason: string };
    cancel: { is_eligible: boolean; reason: string };
    mark_cannot_fulfill: { is_eligible: boolean; reason: string };
    adjust_etd_time: { is_eligible: boolean; reason: string };
    customer_request_etd: { is_eligible: boolean; reason: string };
  };
  failure_info?: {
    reason: string;
    failure_attributed_to_party: string;
    will_merchant_be_paid: boolean;
    description: string;
  };
  created_time: string;
  has_membership_pass: boolean;
  retailer_loyalty_info?: {
    loyalty_number: number;
  };
  order_tracking_metadata?: {
    url: string;
  };
}
