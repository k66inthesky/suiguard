import { FEATURES } from "@src/constants";

export type Page = {
  [K in keyof typeof FEATURES]: K;
}[keyof typeof FEATURES];

export type BlocklistData = {
  coin: any[];
  object: any[];
  domain: any[];
  package: any[];
  totalRecords: number;
};
