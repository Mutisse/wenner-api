const Order = require('./../models/orderModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// GET - Receita Total
exports.getTotalRevenue = catchAsync(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $match: { paid: true }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' },
        totalOrders: { $sum: 1 }
      }
    }
  ]);

  const data = stats[0] || { totalRevenue: 0, totalOrders: 0 };

  res.status(200).json({
    status: 'success',
    data: {
      totalRevenue: data.totalRevenue,
      totalOrders: data.totalOrders,
      currency: 'MZN'
    }
  });
});

// GET - Ticket Médio
exports.getAverageTicket = catchAsync(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $match: { paid: true }
    },
    {
      $group: {
        _id: null,
        averageTicket: { $avg: '$totalPrice' },
        totalOrders: { $sum: 1 }
      }
    }
  ]);

  const data = stats[0] || { averageTicket: 0, totalOrders: 0 };

  res.status(200).json({
    status: 'success',
    data: {
      averageTicket: data.averageTicket,
      totalOrders: data.totalOrders,
      currency: 'MZN'
    }
  });
});

// GET - Total de Pedidos
exports.getTotalOrders = catchAsync(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'entregue'] }, 1, 0] }
        }
      }
    }
  ]);

  const data = stats[0] || { totalOrders: 0, deliveredOrders: 0 };

  res.status(200).json({
    status: 'success',
    data: {
      totalOrders: data.totalOrders,
      deliveredOrders: data.deliveredOrders,
      pendingOrders: data.totalOrders - data.deliveredOrders
    }
  });
});

// GET - Taxa de Entrega
exports.getDeliveryRate = catchAsync(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'entregue'] }, 1, 0] }
        }
      }
    }
  ]);

  const data = stats[0] || { totalOrders: 0, deliveredOrders: 0 };
  const rate =
    data.totalOrders > 0
      ? ((data.deliveredOrders / data.totalOrders) * 100).toFixed(2)
      : 0;

  res.status(200).json({
    status: 'success',
    data: {
      deliveryRate: rate,
      deliveredOrders: data.deliveredOrders,
      totalOrders: data.totalOrders
    }
  });
});

// GET - Vendas por Status
exports.getSalesByStatus = catchAsync(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        quantity: { $sum: 1 },
        totalValue: { $sum: '$totalPrice' }
      }
    },
    {
      $sort: { quantity: -1 }
    }
  ]);

  // Calcular percentual
  const totalOrders = stats.reduce((sum, stat) => sum + stat.quantity, 0);
  const formattedStats = stats.map(stat => ({
    status: stat._id || 'desconhecido',
    quantity: stat.quantity,
    totalValue: stat.totalValue.toFixed(2),
    percentage:
      totalOrders > 0 ? ((stat.quantity / totalOrders) * 100).toFixed(2) : 0
  }));

  res.status(200).json({
    status: 'success',
    data: {
      salesByStatus: formattedStats,
      totalOrders: totalOrders
    }
  });
});

// GET - Principais Clientes
exports.getTopClients = catchAsync(async (req, res, next) => {
  const topClients = await Order.aggregate([
    {
      $group: {
        _id: '$user',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalPrice' },
        lastOrder: { $max: '$createdAt' }
      }
    },
    {
      $sort: { totalSpent: -1 }
    },
    {
      $limit: 5
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: '$userInfo'
    },
    {
      $project: {
        _id: 0,
        clientId: '$_id',
        clientName: '$userInfo.name',
        totalOrders: 1,
        totalSpent: { $round: ['$totalSpent', 2] },
        lastOrder: {
          $dateToString: { format: '%d/%m/%Y', date: '$lastOrder' }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: topClients.length,
    data: {
      topClients: topClients
    }
  });
});

// GET - Dashboard Completo (todos os relatórios)
exports.getDashboard = catchAsync(async (req, res, next) => {
  // Receita Total
  const revenueStats = await Order.aggregate([
    { $match: { paid: true } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' },
        totalOrders: { $sum: 1 }
      }
    }
  ]);
  const revenue = revenueStats[0] || { totalRevenue: 0, totalOrders: 0 };

  // Ticket Médio
  const avgTicketStats = await Order.aggregate([
    { $match: { paid: true } },
    {
      $group: {
        _id: null,
        averageTicket: { $avg: '$totalPrice' }
      }
    }
  ]);
  const avgTicket = avgTicketStats[0] || { averageTicket: 0 };

  // Total de Pedidos
  const orderStats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'entregue'] }, 1, 0] }
        }
      }
    }
  ]);
  const orders = orderStats[0] || { totalOrders: 0, deliveredOrders: 0 };

  // Taxa de Entrega
  const deliveryRate =
    orders.totalOrders > 0
      ? ((orders.deliveredOrders / orders.totalOrders) * 100).toFixed(2)
      : 0;

  // Vendas por Status
  const statusStats = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        quantity: { $sum: 1 },
        totalValue: { $sum: '$totalPrice' }
      }
    }
  ]);

  const totalOrders = statusStats.reduce((sum, stat) => sum + stat.quantity, 0);
  const salesByStatus = statusStats.map(stat => ({
    status: stat._id || 'desconhecido',
    quantity: stat.quantity,
    totalValue: stat.totalValue.toFixed(2),
    percentage:
      totalOrders > 0 ? ((stat.quantity / totalOrders) * 100).toFixed(2) : 0
  }));

  // Principais Clientes
  const topClients = await Order.aggregate([
    {
      $group: {
        _id: '$user',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalPrice' },
        lastOrder: { $max: '$createdAt' }
      }
    },
    {
      $sort: { totalSpent: -1 }
    },
    {
      $limit: 5
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: '$userInfo'
    },
    {
      $project: {
        _id: 0,
        clientName: '$userInfo.name',
        totalOrders: 1,
        totalSpent: { $round: ['$totalSpent', 2] },
        lastOrder: {
          $dateToString: { format: '%d/%m/%Y', date: '$lastOrder' }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalRevenue: {
        value: revenue.totalRevenue.toFixed(2),
        orders: revenue.totalOrders,
        currency: 'MZN'
      },
      averageTicket: {
        value: avgTicket.averageTicket.toFixed(2),
        currency: 'MZN'
      },
      totalOrders: {
        total: orders.totalOrders,
        delivered: orders.deliveredOrders,
        pending: orders.totalOrders - orders.deliveredOrders
      },
      deliveryRate: {
        value: deliveryRate,
        unit: '%'
      },
      salesByStatus: salesByStatus,
      topClients: topClients
    }
  });
});

// GET - Gráfico de Vendas por Período
exports.getSalesByPeriod = catchAsync(async (req, res, next) => {
  const { period = 'day' } = req.query; // day, week, month, year

  let groupFormat;
  switch (period) {
    case 'week':
      groupFormat = { $week: '$createdAt' };
      break;
    case 'month':
      groupFormat = { $month: '$createdAt' };
      break;
    case 'year':
      groupFormat = { $year: '$createdAt' };
      break;
    case 'day':
    default:
      groupFormat = {
        $dateToString: { format: '%d/%m/%Y', date: '$createdAt' }
      };
  }

  const sales = await Order.aggregate([
    {
      $group: {
        _id: groupFormat,
        totalSales: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      salesByPeriod: sales,
      period: period
    }
  });
});
