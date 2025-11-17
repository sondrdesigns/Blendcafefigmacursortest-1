import React from 'react';
import { BarChart3, TrendingUp, Users, Star, Eye, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export function BusinessDashboard() {
  const stats = [
    { label: 'Total Views', value: '12,345', change: '+12%', icon: Eye },
    { label: 'Average Rating', value: '4.8', change: '+0.2', icon: Star },
    { label: 'Total Reviews', value: '342', change: '+28', icon: MessageSquare },
    { label: 'Peak Visitors', value: '156', change: '+8%', icon: Users },
  ];

  const weeklyData = [
    { day: 'Mon', visitors: 120, reviews: 8 },
    { day: 'Tue', visitors: 140, reviews: 12 },
    { day: 'Wed', visitors: 135, reviews: 10 },
    { day: 'Thu', visitors: 165, reviews: 15 },
    { day: 'Fri', visitors: 180, reviews: 18 },
    { day: 'Sat', visitors: 210, reviews: 22 },
    { day: 'Sun', visitors: 195, reviews: 20 },
  ];

  const ratingDistribution = [
    { stars: '5★', count: 215 },
    { stars: '4★', count: 89 },
    { stars: '3★', count: 28 },
    { stars: '2★', count: 7 },
    { stars: '1★', count: 3 },
  ];

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="mb-2">Business Dashboard</h1>
          <p className="text-muted-foreground">
            Track your café's performance and customer engagement
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-5 h-5 text-muted-foreground" />
                    <Badge
                      variant={stat.change.startsWith('+') ? 'default' : 'secondary'}
                      style={
                        stat.change.startsWith('+')
                          ? { backgroundColor: 'var(--status-open)' }
                          : {}
                      }
                    >
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="text-2xl font-semibold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Weekly Visitors</CardTitle>
                <CardDescription>
                  Daily visitor count and review submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visitors" fill="var(--brand-primary)" />
                    <Bar dataKey="reviews" fill="var(--brand-accent)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>
                  Breakdown of customer ratings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stars" type="category" />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--brand-primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>
                Latest customer feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    user: 'Sarah J.',
                    rating: 5,
                    text: 'Amazing coffee and perfect atmosphere for working!',
                    time: '2 hours ago',
                  },
                  {
                    user: 'Mike B.',
                    rating: 4,
                    text: 'Great coffee, but can get quite busy during peak hours.',
                    time: '5 hours ago',
                  },
                  {
                    user: 'Emily C.',
                    rating: 5,
                    text: 'Perfect date spot! The ambiance is so warm and inviting.',
                    time: '1 day ago',
                  },
                ].map((review, index) => (
                  <div key={index} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.user}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{review.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
