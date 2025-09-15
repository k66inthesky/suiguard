import { PageItem } from "@src/constants";

export type Page = {
  [K in keyof typeof PageItem]: K;
}[keyof typeof PageItem];

export type BlocklistData = {
  coin: any[];
  object: any[];
  domain: any[];
  package: any[];
  totalRecords: number;
};
