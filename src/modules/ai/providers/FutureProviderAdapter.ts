import { BaseProviderAdapter } from "./BaseProviderAdapter";

export class FutureProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super("future");
  }
}

export const futureProviderAdapter = new FutureProviderAdapter();
