import Alert from '../models/Alert.js';
import Measurement from '../models/Measurement.js';
import Process from '../models/Process.js';
import User from '../models/User.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const getDateNDaysAgo = (days) => new Date(Date.now() - days * DAY_MS);

const formatShortDate = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const formatShortMonth = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
  });

const pctChange = (current, previous) => {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
};

const trendFromPct = (pct) => {
  if (pct > 1) return 'up';
  if (pct < -1) return 'down';
  return 'neutral';
};

const trendLabelFromPct = (pct) => {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${Math.round(pct)}%`;
};

const buildLastDaysLabels = (days) => {
  const labels = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    labels.push(formatShortDate(getDateNDaysAgo(i)));
  }
  return labels;
};

const buildLastMonthsLabels = (months) => {
  const labels = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(formatShortMonth(d));
  }
  return labels;
};

export const getDashboardOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const last30Start = getDateNDaysAgo(30);
    const prev30Start = getDateNDaysAgo(60);
    const prev30End = last30Start;

    const [
      totalUsers,
      activeUsers,
      activeProcesses,
      openAlerts,
      measurementsLast30,
      measurementsPrev30,
      alertsCreatedLast30,
      alertsCreatedPrev30,
      newUsersLast30,
      newUsersPrev30,
      roleCounts,
      measurementsByDayAgg,
      alertsByDayAgg,
      usersByDayAgg,
      measurementsByMonthAgg,
      alertsByMonthAgg,
      usersByMonthAgg,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      Process.countDocuments({ status: 'active' }),
      Alert.countDocuments({ status: 'not_treated' }),
      Measurement.countDocuments({ date: { $gte: last30Start } }),
      Measurement.countDocuments({ date: { $gte: prev30Start, $lt: prev30End } }),
      Alert.countDocuments({ date: { $gte: last30Start } }),
      Alert.countDocuments({ date: { $gte: prev30Start, $lt: prev30End } }),
      User.countDocuments({ createdAt: { $gte: last30Start } }),
      User.countDocuments({ createdAt: { $gte: prev30Start, $lt: prev30End } }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $project: { _id: 0, role: '$_id', count: 1 } },
      ]),
      Measurement.aggregate([
        { $match: { date: { $gte: last30Start } } },
        {
          $group: {
            _id: {
              y: { $year: '$date' },
              m: { $month: '$date' },
              d: { $dayOfMonth: '$date' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Alert.aggregate([
        { $match: { date: { $gte: last30Start } } },
        {
          $group: {
            _id: {
              y: { $year: '$date' },
              m: { $month: '$date' },
              d: { $dayOfMonth: '$date' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: last30Start } } },
        {
          $group: {
            _id: {
              y: { $year: '$createdAt' },
              m: { $month: '$createdAt' },
              d: { $dayOfMonth: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Measurement.aggregate([
        { $match: { date: { $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) } } },
        {
          $group: {
            _id: {
              y: { $year: '$date' },
              m: { $month: '$date' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Alert.aggregate([
        { $match: { date: { $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) } } },
        {
          $group: {
            _id: {
              y: { $year: '$date' },
              m: { $month: '$date' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) } } },
        {
          $group: {
            _id: {
              y: { $year: '$createdAt' },
              m: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const dayKey = (y, m, d) => `${y}-${m}-${d}`;
    const monthKey = (y, m) => `${y}-${m}`;

    const measurementsByDayMap = new Map(
      measurementsByDayAgg.map((item) => [dayKey(item._id.y, item._id.m, item._id.d), item.count]),
    );
    const alertsByDayMap = new Map(
      alertsByDayAgg.map((item) => [dayKey(item._id.y, item._id.m, item._id.d), item.count]),
    );
    const usersByDayMap = new Map(
      usersByDayAgg.map((item) => [dayKey(item._id.y, item._id.m, item._id.d), item.count]),
    );

    const measurementsByMonthMap = new Map(
      measurementsByMonthAgg.map((item) => [monthKey(item._id.y, item._id.m), item.count]),
    );
    const alertsByMonthMap = new Map(
      alertsByMonthAgg.map((item) => [monthKey(item._id.y, item._id.m), item.count]),
    );
    const usersByMonthMap = new Map(
      usersByMonthAgg.map((item) => [monthKey(item._id.y, item._id.m), item.count]),
    );

    const labels30Days = buildLastDaysLabels(30);
    const measurementsSeries30 = [];
    const alertsSeries30 = [];
    const usersSeries30 = [];

    for (let i = 29; i >= 0; i -= 1) {
      const d = getDateNDaysAgo(i);
      const key = dayKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
      measurementsSeries30.push(measurementsByDayMap.get(key) || 0);
      alertsSeries30.push(alertsByDayMap.get(key) || 0);
      usersSeries30.push(usersByDayMap.get(key) || 0);
    }

    const labelsMonths = buildLastMonthsLabels(7);
    const measurementsSeriesMonths = [];
    const alertsSeriesMonths = [];
    const usersSeriesMonths = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d.getFullYear(), d.getMonth() + 1);
      measurementsSeriesMonths.push(measurementsByMonthMap.get(key) || 0);
      alertsSeriesMonths.push(alertsByMonthMap.get(key) || 0);
      usersSeriesMonths.push(usersByMonthMap.get(key) || 0);
    }

    const measurementPct = pctChange(measurementsLast30, measurementsPrev30);
    const alertsPct = pctChange(alertsCreatedLast30, alertsCreatedPrev30);
    const usersPct = pctChange(newUsersLast30, newUsersPrev30);

    const roleMap = roleCounts.reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {});

    const roleDistribution = [
      { role: 'manager', count: roleMap.manager || 0 },
      { role: 'quality', count: roleMap.quality || 0 },
      { role: 'operator', count: roleMap.operator || 0 },
    ];

    return res.status(200).json({
      success: true,
      user: req.user,
      overview: {
        totalUsers,
        activeUsers,
        activeProcesses,
        openAlerts,
      },
      cards: [
        {
          title: 'Active users',
          value: activeUsers,
          interval: 'Current total',
          trend: trendFromPct(usersPct),
          trendLabel: trendLabelFromPct(usersPct),
          data: usersSeries30,
        },
        {
          title: 'Measurements',
          value: measurementsLast30,
          interval: 'Last 30 days',
          trend: trendFromPct(measurementPct),
          trendLabel: trendLabelFromPct(measurementPct),
          data: measurementsSeries30,
        },
        {
          title: 'New alerts',
          value: alertsCreatedLast30,
          interval: 'Last 30 days',
          trend: trendFromPct(alertsPct),
          trendLabel: trendLabelFromPct(alertsPct),
          data: alertsSeries30,
        },
      ],
      sessionsChart: {
        labels: labels30Days,
        total: measurementsLast30,
        deltaLabel: trendLabelFromPct(measurementPct),
        deltaTrend: trendFromPct(measurementPct),
        series: {
          measurements: measurementsSeries30,
          alerts: alertsSeries30,
          users: usersSeries30,
        },
      },
      monthlyChart: {
        labels: labelsMonths,
        total: measurementsSeriesMonths.reduce((sum, value) => sum + value, 0),
        deltaLabel: trendLabelFromPct(measurementPct),
        deltaTrend: trendFromPct(measurementPct),
        series: {
          measurements: measurementsSeriesMonths,
          alerts: alertsSeriesMonths,
          users: usersSeriesMonths,
        },
      },
      roleDistribution,
    });
  } catch (error) {
    return next(error);
  }
};
