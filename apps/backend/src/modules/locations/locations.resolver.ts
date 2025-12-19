import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Country, State, LGA, Ward, PollingUnit } from './entities/location.entity';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';

@Resolver()
export class LocationsResolver {
  constructor(private locationsService: LocationsService) {}

  // ============================================
  // COUNTRIES
  // ============================================

  @Query(() => [Country], { name: 'countries' })
  @UseGuards(GqlAuthGuard)
  async countries() {
    return this.locationsService.getCountries();
  }

  @Query(() => Country, { name: 'country', nullable: true })
  @UseGuards(GqlAuthGuard)
  async country(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getCountry(id);
  }

  // ============================================
  // STATES
  // ============================================

  @Query(() => [State], { name: 'states' })
  @UseGuards(GqlAuthGuard)
  async states(
    @Args('countryId', { type: () => String, nullable: true }) countryId?: string,
  ) {
    return this.locationsService.getStates(countryId);
  }

  @Query(() => State, { name: 'state', nullable: true })
  @UseGuards(GqlAuthGuard)
  async state(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getState(id);
  }

  // ============================================
  // LGAs
  // ============================================

  @Query(() => [LGA], { name: 'lgas' })
  @UseGuards(GqlAuthGuard)
  async lgas(
    @Args('stateId', { type: () => String, nullable: true }) stateId?: string,
  ) {
    return this.locationsService.getLGAs(stateId);
  }

  @Query(() => LGA, { name: 'lga', nullable: true })
  @UseGuards(GqlAuthGuard)
  async lga(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getLGA(id);
  }

  // ============================================
  // WARDS
  // ============================================

  @Query(() => [Ward], { name: 'wards' })
  @UseGuards(GqlAuthGuard)
  async wards(
    @Args('lgaId', { type: () => String, nullable: true }) lgaId?: string,
  ) {
    return this.locationsService.getWards(lgaId);
  }

  @Query(() => Ward, { name: 'ward', nullable: true })
  @UseGuards(GqlAuthGuard)
  async ward(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getWard(id);
  }

  // ============================================
  // POLLING UNITS
  // ============================================

  @Query(() => [PollingUnit], { name: 'pollingUnits' })
  @UseGuards(GqlAuthGuard)
  async pollingUnits(
    @Args('wardId', { type: () => String, nullable: true }) wardId?: string,
  ) {
    return this.locationsService.getPollingUnits(wardId);
  }

  @Query(() => PollingUnit, { name: 'pollingUnit', nullable: true })
  @UseGuards(GqlAuthGuard)
  async pollingUnit(@Args('id', { type: () => String }) id: string) {
    return this.locationsService.getPollingUnit(id);
  }
}
