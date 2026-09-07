export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export interface ExcedenteSugestao {
  label: string;
  amount: number;
}

export interface ExcedenteResult {
  weeklyBaseIncome: number;
  recebidoSemana: number;
  dizimoSemana: number;
  liquidoSemana: number;
  necessidadesFixas: number;
  sobraOuDeficit: number;
  sugestao: ExcedenteSugestao[] | null;
}

export function computeExcedente(params: {
  weeklyBaseIncome: number;
  recebidoSemana: number;
  fixedTotal: number;
  ceilingTotal: number;
  contasProximas: { title: string; amount: number }[];
}): ExcedenteResult {
  const { weeklyBaseIncome, recebidoSemana, fixedTotal, ceilingTotal, contasProximas } = params;
  const dizimoSemana = recebidoSemana * 0.1;
  const liquidoSemana = recebidoSemana - dizimoSemana;
  const necessidadesFixas = fixedTotal + ceilingTotal;
  const sobraOuDeficit = liquidoSemana - necessidadesFixas;

  if (sobraOuDeficit <= 0) {
    return { weeklyBaseIncome, recebidoSemana, dizimoSemana, liquidoSemana, necessidadesFixas, sobraOuDeficit, sugestao: null };
  }

  let restante = sobraOuDeficit;
  const sugestao: ExcedenteSugestao[] = [];

  const contasTotal = contasProximas.reduce((s, b) => s + b.amount, 0);
  if (contasTotal > 0) {
    const usar = Math.min(restante, contasTotal);
    sugestao.push({ label: "Contas que vencem antes da próxima entrada", amount: usar });
    restante -= usar;
  }
  if (restante > 0) {
    sugestao.push({ label: "Regularizar casa (atraso)", amount: restante });
  }

  return { weeklyBaseIncome, recebidoSemana, dizimoSemana, liquidoSemana, necessidadesFixas, sobraOuDeficit, sugestao };
}
