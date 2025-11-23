import { Transaction } from '@mysten/sui/transactions';
import { FEATURES } from './constants';

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

// subscription
export type MoveCallConstructor = (tx: Transaction, id: string) => void;

export type WalrusService = {
  id: string;
  name: string;
  publisherUrl: string;
  aggregatorUrl: string;
};

export type ValidSubscription =
  | {
      id: any;
      created_at: number;
      service_id: any;
    }
  | undefined;
