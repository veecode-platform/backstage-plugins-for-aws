import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
} from '@material-ui/core';
import CloudQueueIcon from '@material-ui/icons/CloudQueue';
import Alert from '@material-ui/lab/Alert';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useApi } from '@backstage/core-plugin-api';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import { costInsightsApiRef } from '@backstage-community/plugin-cost-insights';
import { Cost } from '@backstage-community/plugin-cost-insights-common';
import { useEntity } from '@backstage/plugin-catalog-react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { costInsightsTranslationRef } from '../translations';
import { RichPeriodSelect } from './RichPeriodSelect';

export const CleanEntityCostCard = () => {
  const client = useApi(costInsightsApiRef);
  const { entity } = useEntity();
  const { t } = useTranslationRef(costInsightsTranslationRef);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costData, setCostData] = useState<Cost | null>(null);
  const [intervals, setIntervals] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return `R30/P1D/${today}`;
  });
  const [periodLabel, setPeriodLabel] = useState('Past 30 Days');
  const [tabIndex, setTabIndex] = useState(0);

  const entityRef = stringifyEntityRef(entity);
  const tagAnnotation =
    entity.metadata.annotations?.['aws.amazon.com/cost-insights-tags'] ||
    entity.metadata.annotations?.['aws.amazon.com/cost-insights-cost-categories'];

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!client.getCatalogEntityDailyCost) return;
      setLoading(true);
      setError(null);
      try {
        const data = await client.getCatalogEntityDailyCost(entityRef, intervals);
        if (mounted) {
          setCostData(data);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Error fetching entity cost data');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [client, entityRef, intervals]);

  const serviceList = useMemo(() => {
    if (!costData?.groupedCosts?.service) return [];
    if (Array.isArray(costData.groupedCosts.service)) {
      return (costData.groupedCosts.service as any[]).map(s => s.id);
    }
    return [];
  }, [costData]);

  const totalPeriodCost = useMemo(() => {
    if (!costData?.aggregation) return 0;
    return costData.aggregation.reduce((acc, curr) => acc + curr.amount, 0);
  }, [costData]);

  const dailyAverageCost = useMemo(() => {
    if (!costData?.aggregation || costData.aggregation.length === 0) return 0;
    return totalPeriodCost / costData.aggregation.length;
  }, [costData, totalPeriodCost]);

  const chartData = useMemo(() => {
    if (!costData) return [];
    if (tabIndex === 0 || serviceList.length <= 1) {
      return (costData.aggregation || []).map(item => ({
        date: item.date,
        cost: Number(item.amount.toFixed(4)),
      }));
    }

    if (Array.isArray(costData.groupedCosts?.service)) {
      const dates = (costData.aggregation || []).map(a => a.date);
      return dates.map(date => {
        const point: Record<string, any> = { date };
        (costData.groupedCosts!.service as any[]).forEach(svc => {
          const match = (svc.aggregation || []).find((a: any) => a.date === date);
          point[svc.id] = match ? Number(match.amount.toFixed(4)) : 0;
        });
        return point;
      });
    }
    return [];
  }, [costData, tabIndex, serviceList]);

  const serviceColors = [
    '#1976d2',
    '#388e3c',
    '#f57c00',
    '#7b1fa2',
    '#0097a7',
    '#c2185b',
  ];

  return (
    <Card variant="outlined" style={{ width: '100%' }}>
      <CardContent>
        {/* Title and Subtitle */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={2}
          style={{ gap: 16 }}
        >
          <Box display="flex" alignItems="center">
            <CloudQueueIcon color="primary" style={{ marginRight: 12, fontSize: 32 }} />
            <div>
              <Typography variant="h6" color="textPrimary">
                {t('entityCard.cloudTitle')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {serviceList.length === 1
                  ? t('entityCard.cloudSubtitleSingle' as any, { service: serviceList[0] })
                  : t('entityCard.cloudSubtitleMultiple' as any, { tags: tagAnnotation || 'default' })}
              </Typography>
            </div>
          </Box>

          <RichPeriodSelect
            initialPreset="P30D"
            onPeriodChange={(newIntervals, newLabel) => {
              setIntervals(newIntervals);
              setPeriodLabel(newLabel);
            }}
          />
        </Box>

        {/* KPI Banner */}
        <Box
          display="flex"
          alignItems="baseline"
          mb={2}
          p={1.5}
          bgcolor="action.hover"
          borderRadius={6}
          style={{ gap: 20 }}
        >
          <div>
            <Typography variant="caption" color="textSecondary" style={{ textTransform: 'uppercase' }}>
              {t('globalPage.totalPeriodLabel' as any, { period: periodLabel })}
            </Typography>
            <Typography variant="h5" style={{ fontWeight: 700, color: '#1976d2' }}>
              ${totalPeriodCost.toFixed(4)}
            </Typography>
          </div>
          <Divider orientation="vertical" flexItem />
          <div>
            <Typography variant="caption" color="textSecondary" style={{ textTransform: 'uppercase' }}>
              {t('globalPage.dailyAverageLabel')}
            </Typography>
            <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
              {t('entityCard.dailyAvgFormat' as any, { avg: dailyAverageCost.toFixed(4) })}
            </Typography>
          </div>
        </Box>

        {serviceList.length > 1 && (
          <Box mb={2}>
            <Tabs
              value={tabIndex}
              indicatorColor="primary"
              textColor="primary"
              onChange={(_, val) => setTabIndex(val)}
            >
              <Tab label={t('entityCard.totalCostTab')} />
              <Tab label={t('entityCard.breakdownTab')} />
            </Tabs>
          </Box>
        )}

        <Divider style={{ marginBottom: 20 }} />

        {error && (
          <Box mb={2}>
            <Alert severity="error">
              {t('entityCard.fetchError' as any, { error })}
            </Alert>
          </Box>
        )}

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={300}
          >
            <CircularProgress />
          </Box>
        ) : chartData.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={300}
          >
            <Typography color="textSecondary">
              {t('entityCard.noData')}
            </Typography>
          </Box>
        ) : (
          <Box width="100%" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient
                    id="colorEntityCost"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={val => `$${val}`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `$${Number(val).toFixed(4)}`,
                    `${name || serviceList[0] || 'Daily Cost'}`,
                  ]}
                  labelFormatter={label => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: '#222',
                    borderRadius: 6,
                    color: '#fff',
                  }}
                />
                {tabIndex === 0 || serviceList.length <= 1 ? (
                  <Area
                    type="monotone"
                    dataKey="cost"
                    name={serviceList[0] || 'AWS Resource'}
                    stroke="#1976d2"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEntityCost)"
                  />
                ) : (
                  serviceList.map((svc, idx) => (
                    <Area
                      key={svc}
                      type="monotone"
                      dataKey={svc}
                      name={svc}
                      stroke={serviceColors[idx % serviceColors.length]}
                      fill={serviceColors[idx % serviceColors.length]}
                      fillOpacity={0.2}
                      stackId="1"
                    />
                  ))
                )}
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
