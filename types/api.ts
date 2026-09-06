export type Locale = "en" | "fr" | "de" | "it" | "pt" | "es" | "zh";

export type SeoFields = {
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  canonical?: string | null;
  structure_schema?: string | object | object[] | null;
  viewport?: string | null;
  robots?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  og_type?: string | null;
  twitter_card?: string | null;
  twitter_description?: string | null;
  twitter_title?: string | null;
  twitter_image?: string | null;
  twitter_creator?: string | null;
};

export type ApiPage = {
  id?: number;
  title?: string;
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string | null;
  content?: string;
  banner?: string;
  featured_image?: string;
  image?: string;
  gallery?: string[];
  created_at?: string | null;
  published_at?: string | null;
  related_tours?: Tour[];
  categories?: { id?: number; name?: string; title?: string; slug?: string }[];
  metas?: { meta_key?: string; meta_value?: string; value?: string; title?: string; description?: string; [key: string]: unknown }[];
  seo?: SeoFields | null;
  [key: string]: unknown;
};

export type SiteSetting = {
  id?: number;
  option_key: string;
  option_value: unknown;
};

export type SocialLink = {
  type: string;
  url: string;
};

export type TeamMember = {
  name: string;
  position: string;
  image: string;
};

export type PublicSiteSettings = {
  siteTitle: string | null;
  notificationEmails: string[];
  socialLinks: SocialLink[];
  locationUrl: string | null;
};

export type TripTaxonomy = {
  allCategories: ApiPage[];
  rootCategories: ApiPage[];
  childCategories: ApiPage[];
  destinations: ApiPage[];
  counts: Record<string, number>;
  available: boolean;
};

export type ApiList<T> = {
  data?: T[] | { data?: T[]; current_page?: number; from?: number; to?: number; total?: number; last_page?: number };
  current_page?: number;
  from?: number;
  to?: number;
  total?: number;
  last_page?: number;
  meta?: unknown;
  links?: unknown;
};

export type Tour = ApiPage & {
  price?: number | string;
  start_from?: number | string;
  adult_price?: number | string;
  child_price?: number | string;
  infant_price?: number | string;
  offer?: number | string;
  offer_end_date?: string;
  is_inquiry?: boolean;
  duration?: string;
  duration_in_days?: number | string;
  pickup_time?: string;
  run?: string;
  type?: string;
  overview?: string;
  highlights?: string;
  included?: string;
  excluded?: string;
  city?: string;
  destination?: string;
  category?: { name?: string; title?: string; slug?: string };
  categories?: { id?: number; name?: string; title?: string; slug?: string }[];
  destinations?: {
    id?: number;
    parent_id?: number;
    name?: string;
    title?: string;
    slug?: string;
    global?: boolean;
    enabled?: boolean;
    featured?: boolean;
    latitude?: string;
    longitude?: string;
    display_order?: number;
    banner?: string | null;
    phone_banner?: string | null;
    featured_image?: string | null;
    gallery?: string[];
    pivot?: { tour_id?: number; destination_id?: number; order?: number };
  }[];
  images?: string[];
  gallery?: string[];
  options?: {
    id?: number;
    name?: string;
    description?: string | null;
    adult_price?: number | string;
    child_price?: number | string;
    pricing_groups?: { from?: number; to?: number; price?: number | string; child_price?: number | string }[];
  }[];
  days?: {
    id?: number;
    tour_id?: number;
    title?: string;
    description?: string;
    translations?: { id?: number; tour_day_id?: number; locale?: string; title?: string; description?: string }[];
  }[];
  seasons?: {
    id?: number;
    title?: string;
    date?: string;
    calender_availability?: {
      day_numbers?: number[];
      day_names?: string[];
      month_names?: string[];
      years_numbers?: number[];
    };
    pricing_groups?: { from?: number; to?: number; price?: number | string; child_price?: number | string }[];
  }[];
  social_links?: { type?: string; image?: string; icon?: string; url?: string }[] | null;
};
