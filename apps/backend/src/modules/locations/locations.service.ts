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

  // ============================================
  // LOCATION CODE LOOKUP
  // ============================================

  /**
   * Look up location hierarchy by composite code
   * Format: "STATE_CODE/LGA_CODE/WARD_CODE/POLLING_UNIT_CODE"
   * Example: "24/07/05/003"
   */
  async lookupByCode(code: string): Promise<{
    valid: boolean;
    error?: string;
    state?: any;
    lga?: any;
    ward?: any;
    pollingUnit?: any;
  }> {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Invalid code format' };
    }

    // Normalize the code - remove spaces and convert to uppercase
    const normalizedCode = code.trim().toUpperCase();

    // Split by common delimiters: /, -, or space
    const parts = normalizedCode.split(/[\/\-\s]+/).filter(Boolean);

    if (parts.length < 2 || parts.length > 4) {
      return {
        valid: false,
        error: 'Code must have 2-4 parts (State/LGA/Ward/PollingUnit)',
      };
    }

    const [stateCode, lgaCode, wardCode, pollingUnitCode] = parts;

    // Look up state by code
    const state = await this.prisma.state.findFirst({
      where: { code: stateCode },
      include: { country: true },
    });

    if (!state) {
      return { valid: false, error: `State with code "${stateCode}" not found` };
    }

    // Look up LGA by code within the state
    const lga = await this.prisma.lGA.findFirst({
      where: {
        code: lgaCode,
        stateId: state.id,
      },
      include: {
        state: { include: { country: true } },
      },
    });

    if (!lga) {
      return {
        valid: false,
        error: `LGA with code "${lgaCode}" not found in ${state.name}`,
        state,
      };
    }

    // If only state and LGA provided, return partial result
    if (!wardCode) {
      return { valid: true, state, lga };
    }

    // Look up ward by code within the LGA
    const ward = await this.prisma.ward.findFirst({
      where: {
        code: wardCode,
        lgaId: lga.id,
      },
      include: {
        lga: {
          include: {
            state: { include: { country: true } },
          },
        },
      },
    });

    if (!ward) {
      return {
        valid: false,
        error: `Ward with code "${wardCode}" not found in ${lga.name}`,
        state,
        lga,
      };
    }

    // If no polling unit code, return state/lga/ward
    if (!pollingUnitCode) {
      return { valid: true, state, lga, ward };
    }

    // Look up polling unit by code within the ward
    const pollingUnit = await this.prisma.pollingUnit.findFirst({
      where: {
        code: pollingUnitCode,
        wardId: ward.id,
      },
      include: {
        ward: {
          include: {
            lga: {
              include: {
                state: { include: { country: true } },
              },
            },
          },
        },
      },
    });

    if (!pollingUnit) {
      return {
        valid: false,
        error: `Polling Unit with code "${pollingUnitCode}" not found in ${ward.name}`,
        state,
        lga,
        ward,
      };
    }

    return { valid: true, state, lga, ward, pollingUnit };
  }
}
