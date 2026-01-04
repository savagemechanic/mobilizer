import { Resolver, Query, Args } from '@nestjs/graphql';
import { LocationsService } from './locations.service';
import {
  Country,
  State,
  LGA,
  Ward,
  PollingUnit,
  LocationLookupResult,
} from './entities/location.entity';

@Resolver()
export class LocationsResolver {
  constructor(private locationsService: LocationsService) {}

  // ============================================
  // COUNTRIES (Public - needed for registration)
  // ============================================

  @Query(() => [Country], { name: 'countries' })
  async countries() {
    return this.locationsService.getCountries();
  }

  @Query(() => Country, { name: 'country', nullable: true })
  async country(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getCountry(id);
  }

  // ============================================
  // STATES (Public - needed for registration)
  // ============================================

  @Query(() => [State], { name: 'states' })
  async states(
    @Args('countryId', { type: () => String, nullable: true }) countryId?: string,
  ) {
    return this.locationsService.getStates(countryId);
  }

  @Query(() => State, { name: 'state', nullable: true })
  async state(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getState(id);
  }

  // ============================================
  // LGAs (Public - needed for registration)
  // ============================================

  @Query(() => [LGA], { name: 'lgas' })
  async lgas(
    @Args('stateId', { type: () => String, nullable: true }) stateId?: string,
  ) {
    return this.locationsService.getLGAs(stateId);
  }

  @Query(() => LGA, { name: 'lga', nullable: true })
  async lga(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getLGA(id);
  }

  // ============================================
  // WARDS (Public - needed for registration)
  // ============================================

  @Query(() => [Ward], { name: 'wards' })
  async wards(
    @Args('lgaId', { type: () => String, nullable: true }) lgaId?: string,
  ) {
    return this.locationsService.getWards(lgaId);
  }

  @Query(() => Ward, { name: 'ward', nullable: true })
  async ward(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getWard(id);
  }

  // ============================================
  // POLLING UNITS (Public - needed for registration)
  // ============================================

  @Query(() => [PollingUnit], { name: 'pollingUnits' })
  async pollingUnits(
    @Args('wardId', { type: () => String, nullable: true }) wardId?: string,
  ) {
    return this.locationsService.getPollingUnits(wardId);
  }

  @Query(() => PollingUnit, { name: 'pollingUnit', nullable: true })
  async pollingUnit(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getPollingUnit(id);
  }

  // ============================================
  // LOCATION CODE LOOKUP (Public - needed for registration)
  // ============================================

  @Query(() => LocationLookupResult, { name: 'lookupLocationByCode' })
  async lookupLocationByCode(
    @Args('code', { type: () => String }) code: string,
  ) {
    return this.locationsService.lookupByCode(code);
  }
}
