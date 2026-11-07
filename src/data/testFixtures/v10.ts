import { mockAppData } from '../../mock/data';

export function makeV10Fixture() {
  const policies = mockAppData.policies.map((policy) => {
    const {
      status: _status,
      policyNumber: _policyNumber,
      sumAssured,
      endDate,
      nominee: _nominee,
      note: _note,
      ...rest
    } = policy;
    return {
      ...rest,
      coverAmount: sumAssured ?? null,
      maturityDate: endDate ?? null,
    };
  });
  return { ...mockAppData, policies };
}
