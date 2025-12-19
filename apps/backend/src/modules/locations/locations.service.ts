import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // COUNTRIES
  // ============================================

  async getCountries() {
    return this.prisma.country.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getCountry(id: string) {
    return this.prisma.country.findUnique({
      where: { id },
    });
  }

  // ============================================
  // STATES
  // ============================================

  async getStates(countryId?: string) {
    return this.prisma.state.findMany({
      where: countryId ? { countryId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        country: true,
      },
    });
  }

  async getState(id: string) {
    return this.prisma.state.findUnique({
      where: { id },
      include: {
        country: true,
      },
    });
  }

  // ============================================
  // LGAs
  // ============================================

  async getLGAs(stateId?: string) {
    return this.prisma.lGA.findMany({
      where: stateId ? { stateId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        state: {
          include: {
            country: true,
          },
        },
      },
    });
  }

  async getLGA(id: string) {
    return this.prisma.lGA.findUnique({
      where: { id },
      include: {
        state: {
          include: {
            country: true,
          },
        },
      },
    });
  }

  // ============================================
  // WARDS
  // ============================================

  async getWards(lgaId?: string) {
    return this.prisma.ward.findMany({
      where: lgaId ? { lgaId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        lga: {
          include: {
            state: {
              include: {
                country: true,
              },
            },
          },
        },
      },
    });
  }

  async getWard(id: string) {
    return this.prisma.ward.findUnique({
      where: { id },
      include: {
        lga: {
          include: {
            state: {
              include: {
                country: true,
              },
            },
          },
        },
      },
    });
  }

  // ============================================
  // POLLING UNITS
  // ============================================

  async getPollingUnits(wardId?: string) {
    return this.prisma.pollingUnit.findMany({
      where: wardId ? { wardId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        ward: {
          include: {
            lga: {
              include: {
                state: {
                  include: {
                    country: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getPollingUnit(id: string) {
    return this.prisma.pollingUnit.findUnique({
      where: { id },
      include: {
        ward: {
          include: {
            lga: {
              include: {
                state: {
                  include: {
                    country: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
