import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
} from '@material-ui/core';
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
import { useApi, identityApiRef } from '@backstage/core-plugin-api';
import { costInsightsApiRef } from '@backstage-community/plugin-cost-insights';
import { Cost } from '@backstage-community/plugin-cost-insights-common';
import { Page, Header, Content } from '@backstage/core-components';

export const CleanCostInsightsPage = () => {
  const client = useApi(costInsightsApiRef);
  const identityApi = useApi(identityApiRef);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costData, setCostData] = useState<Cost | null>(null);
  const [duration, setDuration] = useState('P90D');
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const profile = await identityApi.getBackstageIdentity();
        const userGroups = await client.getUserGroups(profile.userEntityRef);
        const targetGroup = userGroups[0]?.id || 'admins';

        const today = new Date().toISOString().split('T')[0];
        const intervals =
          duration === 'P30D'
            ? `R30/P1D/${today}`
            : duration === 'P180D'
            ? `R2/P90D/${today}`
            : `R2/P90D/${today}`;

        const data = await client.getGroupDailyCost(targetGroup, intervals);
        if (mounted) {
          setCostData(data);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Error fetching cost data');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [client, identityApi, duration]);

  const chartData = useMemo(() => {
    if (!costData) return [];
    if (tabIndex === 0 || !costData.groupedCosts) {
      return (costData.aggregation || []).map(item => ({
        date: item.date,
        cost: Number(item.amount.toFixed(2)),
      }));
    }

    // Breakdown by service
    // If groupedCosts.service is an array of Cost objects:
    if (Array.isArray(costData.groupedCosts.service)) {
      const dates = (costData.aggregation || []).map(a => a.date);
      return dates.map(date => {
        const point: Record<string, any> = { date };
        (costData.groupedCosts!.service as any[]).forEach(svc => {
          const match = (svc.aggregation || []).find((a: any) => a.date === date);
          point[svc.id] = match ? Number(match.amount.toFixed(2)) : 0;
        });
        return point;
      });
    }
    return [];
  }, [costData, tabIndex]);

  const serviceList = useMemo(() => {
    if (!costData?.groupedCosts?.service) return [];
    if (Array.isArray(costData.groupedCosts.service)) {
      return (costData.groupedCosts.service as any[]).map(s => s.id);
    }
    return [];
  }, [costData]);

  const serviceColors = [
    '#1976d2',
    '#388e3c',
    '#f57c00',
    '#7b1fa2',
    '#0097a7',
    '#c2185b',
  ];

  return (
    <Page themeId="tool">
      <Header
        title="Cost Insights"
        subtitle="Cloud infrastructure and workload financial overview"
      />
      <Content>
        <Box width="100%" px={0}>
          {error && (
            <Box mb={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}

          <Card variant="outlined" style={{ width: '100%' }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Box>
                  <Tabs
                    value={tabIndex}
                    indicatorColor="primary"
                    textColor="primary"
                    onChange={(_, val) => setTabIndex(val)}
                  >
                    <Tab label="Total cost" />
                    {serviceList.length > 1 && (
                      <Tab label="Breakdown by service" />
                    )}
                  </Tabs>
                </Box>

                <FormControl variant="outlined" size="small">
                  <Select
                    value={duration}
                    onChange={e => setDuration(e.target.value as string)}
                  >
                    <MenuItem value="P30D">Past 30 Days</MenuItem>
                    <MenuItem value="P90D">Past 90 Days</MenuItem>
                    <MenuItem value="P180D">Past 6 Months</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Divider style={{ marginBottom: 24 }} />

              {loading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height={380}
                >
                  <CircularProgress />
                </Box>
              ) : chartData.length === 0 ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height={380}
                >
                  <Typography color="textSecondary">
                    No cost data available for the selected period.
                  </Typography>
                </Box>
              ) : (
                <Box width="100%" height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorCost"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#1976d2"
                            stopOpacity={0.6}
                          />
                          <stop
                            offset="95%"
                            stopColor="#1976d2"
                            stopOpacity={0.05}
                          />
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
                        formatter={(val: any) => [`$${val}`, 'Daily Cost']}
                        labelFormatter={label => `Date: ${label}`}
                        contentStyle={{
                          backgroundColor: '#222',
                          borderRadius: 6,
                          color: '#fff',
                        }}
                      />
                      {tabIndex === 0 ? (
                        <Area
                          type="monotone"
                          dataKey="cost"
                          name="Total Cost"
                          stroke="#1976d2"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorCost)"
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
        </Box>
      </Content>
    </Page>
  );
};
