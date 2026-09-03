import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { costInsightsTranslationRef } from './ref';

export const costInsightsTranslationPt = createTranslationMessages({
  ref: costInsightsTranslationRef,
  messages: {
    'globalPage.title': 'Cost Insights',
    'globalPage.subtitle': 'Visão financeira de infraestrutura em nuvem e workloads',
    'globalPage.totalCostTab': 'Custo total',
    'globalPage.breakdownTab': 'Divisão por serviço',
    'globalPage.totalPeriodLabel': 'Gasto Total ({{period}})',
    'globalPage.dailyAverageLabel': 'Média Diária',
    'globalPage.dailyAvgFormat': '~${{avg}}/dia média',
    'globalPage.noData': 'Nenhum dado de custo disponível para o período selecionado.',
    'globalPage.fetchError': 'Erro ao buscar dados de custo: {{error}}',

    'entityCard.cloudTitle': 'Recursos Dedicados de Nuvem (AWS Cost Explorer)',
    'entityCard.cloudSubtitleSingle': 'Recursos dedicados faturados: {{service}}',
    'entityCard.cloudSubtitleMultiple': 'Recursos de nuvem filtrados por tags da AWS ({{tags}})',
    'entityCard.totalCostPeriodLabel': 'Total no período: ${{total}}',
    'entityCard.totalCostTab': 'Custo total',
    'entityCard.breakdownTab': 'Divisão por serviço',
    'entityCard.dailyAvgFormat': '~${{avg}}/dia média',
    'entityCard.noData': 'Nenhum dado de custo encontrado para este serviço no período selecionado.',
    'entityCard.fetchError': 'Erro ao buscar dados de custo da entidade: {{error}}',

    'clusterCard.title': 'Custos de Workload no Cluster (OpenCost / Kubernetes)',
    'clusterCard.subtitle': 'Consumo real de CPU e memória rateado para o cluster k3s do laboratório',
    'clusterCard.badge': 'k3s em tempo real',
    'clusterCard.workloadHeader': 'Workload / Namespace',
    'clusterCard.cpuCostHeader': 'Custo CPU (Dia)',
    'clusterCard.ramCostHeader': 'Custo RAM (Dia)',
    'clusterCard.dailyTotalHeader': 'Total Diário',
    'clusterCard.monthlyProjectionHeader': 'Projeção Mensal',
    'clusterCard.efficiencyHeader': 'Eficiência',
    'clusterCard.noWorkload': 'Nenhum workload ativo encontrado no cluster k3s para este identificador.',

    'periodSelect.past30Days': 'Últimos 30 Dias',
    'periodSelect.past60Days': 'Últimos 60 Dias',
    'periodSelect.past90Days': 'Últimos 90 Dias',
    'periodSelect.past180Days': 'Últimos 6 Meses (180 Dias)',
    'periodSelect.customRange': 'Intervalo Personalizado...',
    'periodSelect.customTitle': 'Selecionar Período Personalizado',
    'periodSelect.startDate': 'Data Inicial',
    'periodSelect.endDate': 'Data Final',
    'periodSelect.apply': 'Aplicar',
    'periodSelect.cancel': 'Cancelar',
    'periodSelect.daysCount': '{{days}} dias',
  },
});

export default costInsightsTranslationPt;
