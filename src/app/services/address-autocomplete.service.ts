import { Injectable } from '@angular/core';
import { AddressSuggestion } from '../models/address-suggestion.model';

interface LegacyBanFeatureCollection {
  features?: Array<{
    properties?: {
      label?: string;
      name?: string;
      postcode?: string;
      city?: string;
    };
  }>;
}

interface GeopfSearchResponse {
  results?: Array<{
    fulltext?: string;
    kind?: string;
    street?: string;
    zipcode?: string;
    city?: string;
  }>;
}

/**
 * Recherche d'adresses France avec fallback de parsing BAN/IGN.
 */
@Injectable({
  providedIn: 'root'
})
export class AddressAutocompleteService {
  private readonly endpoint = 'https://data.geopf.fr/geocodage/search';

  async searchAddresses(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      return [];
    }

    const url = new URL(this.endpoint);
    url.searchParams.set('q', trimmedQuery);
    url.searchParams.set('limit', '6');

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal
    });

    if (!response.ok) {
      throw new Error(`Adresse API error: ${response.status}`);
    }

    const payload = (await response.json()) as LegacyBanFeatureCollection | GeopfSearchResponse;
    return this.normalizeSuggestions(payload);
  }

  private normalizeSuggestions(payload: LegacyBanFeatureCollection | GeopfSearchResponse): AddressSuggestion[] {
    if ('features' in payload && Array.isArray(payload.features)) {
      return payload.features
        .map((feature: NonNullable<LegacyBanFeatureCollection['features']>[number]) => {
          const properties = feature.properties;

          return {
            label: properties?.label ?? '',
            street: properties?.name ?? '',
            postalCode: properties?.postcode ?? '',
            city: properties?.city ?? ''
          };
        })
        .filter((item: AddressSuggestion) => item.label && item.street);
    }

    if ('results' in payload && Array.isArray(payload.results)) {
      return payload.results
        .map((item: NonNullable<GeopfSearchResponse['results']>[number]) => ({
          label: item.fulltext ?? '',
          street: item.street ?? '',
          postalCode: item.zipcode ?? '',
          city: item.city ?? ''
        }))
        .filter((item: AddressSuggestion) => item.label && item.street);
    }

    return [];
  }
}
