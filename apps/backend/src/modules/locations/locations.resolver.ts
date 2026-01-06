import { Resolver, Query, Args } from '@nestjs/graphql';
import { LocationsService } from './locations.service';
import {
  Country,
  State,
  GeopoliticalZone,
  SenatorialZone,
  FederalConstituency,
  LGA,
  Ward,
  PollingUnit,
  LocationLookupResult,
  LocationLeader,
  LocationStats,
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
  // GEOPOLITICAL ZONES (Public - for dashboard filtering)
  // ============================================

  @Query(() => [GeopoliticalZone], { name: 'geopoliticalZones' })
  async geopoliticalZones(
    @Args('countryId', { type: () => String, nullable: true }) countryId?: string,
  ) {
    return this.locationsService.getGeopoliticalZones(countryId);
  }

  @Query(() => GeopoliticalZone, { name: 'geopoliticalZone', nullable: true })
  async geopoliticalZone(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getGeopoliticalZone(id);
  }

  // ============================================
  // SENATORIAL ZONES (Public - for dashboard filtering)
  // ============================================

  @Query(() => [SenatorialZone], { name: 'senatorialZones' })
  async senatorialZones(
    @Args('stateId', { type: () => String, nullable: true }) stateId?: string,
  ) {
    return this.locationsService.getSenatorialZones(stateId);
  }

  @Query(() => SenatorialZone, { name: 'senatorialZone', nullable: true })
  async senatorialZone(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getSenatorialZone(id);
  }

  // ============================================
  // FEDERAL CONSTITUENCIES (Public - for dashboard filtering)
  // ============================================

  @Query(() => [FederalConstituency], { name: 'federalConstituencies' })
  async federalConstituencies(
    @Args('stateId', { type: () => String, nullable: true }) stateId?: string,
  ) {
    return this.locationsService.getFederalConstituencies(stateId);
  }

  @Query(() => FederalConstituency, { name: 'federalConstituency', nullable: true })
  async federalConstituency(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getFederalConstituency(id);
  }

  // ============================================
  // LGAs (Public - needed for registration)
  // ============================================

  @Query(() => [LGA], { name: 'lgas' })
  async lgas(
    @Args('stateId', { type: () => String, nullable: true }) stateId?: string,
    @Args('senatorialZoneId', { type: () => String, nullable: true }) senatorialZoneId?: string,
    @Args('federalConstituencyId', { type: () => String, nullable: true }) federalConstituencyId?: string,
  ) {
    return this.locationsService.getLGAs(stateId, senatorialZoneId, federalConstituencyId);
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

  // ============================================
  // LOCATION LEADERS
  // ============================================

  @Query(() => [LocationLeader], { name: 'locationLeaders' })
  async locationLeaders(
    @Args('locationId', { type: () => String }) locationId: string,
    @Args('locationType', { type: () => String }) locationType: string,
  ) {
    return this.locationsService.getLocationLeaders(locationId, locationType);
  }

  // ============================================
  // LOCATION STATS
  // ============================================

  @Query(() => LocationStats, { name: 'locationStats' })
  async locationStats(
    @Args('locationId', { type: () => String }) locationId: string,
    @Args('locationType', { type: () => String }) locationType: string,
  ) {
    return this.locationsService.getLocationStats(locationId, locationType);
  }
}
