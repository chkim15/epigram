"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

export interface GraphData {
  type: 'line' | 'scatter' | 'bar' | 'area' | 'combined';
  data: Array<{
    x: number;
    y: number;
    y2?: number;
    label?: string;
  }>;
  xAxis?: {
    label?: string;
    domain?: [number | 'auto', number | 'auto'];
    type?: 'number' | 'category';
  };
  yAxis?: {
    label?: string;
    domain?: [number | 'auto', number | 'auto'];
  };
  title?: string;
  series?: Array<{
    name: string;
    dataKey: string;
    color?: string;
    type?: 'line' | 'scatter' | 'bar' | 'area';
  }>;
  width?: number;
  height?: number;
}

interface GraphRendererProps {
  graphData: GraphData;
  className?: string;
}

export function GraphRenderer({ graphData, className = "" }: GraphRendererProps) {
  // Validate and ensure data is an array
  if (!graphData || !graphData.data || !Array.isArray(graphData.data)) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-400">
        Invalid graph data
      </div>
    );
  }

  const {
    type = 'line',
    data,
    xAxis = {},
    yAxis = {},
    title,
    series,
    height = 300,
  } = graphData;

  // Default colors for multiple series
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Common props for all charts
  const commonProps = {
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 50 },
  };

  const xAxisProps = {
    dataKey: "x",
    label: xAxis.label ? { value: xAxis.label, position: "insideBottom", offset: -10 } : undefined,
    domain: xAxis.domain || ['auto', 'auto'],
    type: xAxis.type || 'number',
    stroke: '#666',
    tick: { fill: '#666' },
  };

  const yAxisProps = {
    label: yAxis.label ? { value: yAxis.label, angle: -90, position: "insideLeft" } : undefined,
    domain: yAxis.domain || ['auto', 'auto'],
    stroke: '#666',
    tick: { fill: '#666' },
  };

  const renderChart = () => {
    switch (type) {
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
              formatter={(value: ValueType, name: NameType) => {
                if (typeof value === 'number') {
                  return value.toFixed(2);
                }
                return String(value);
              }}
            />
            {series ? (
              series.map((s, idx) => (
                <Scatter
                  key={s.name}
                  name={s.name}
                  dataKey={s.dataKey}
                  fill={s.color || colors[idx % colors.length]}
                />
              ))
            ) : (
              <Scatter name="Data" dataKey="y" fill="#3b82f6" />
            )}
            {series && series.length > 1 && <Legend />}
          </ScatterChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
              formatter={(value: ValueType, name: NameType) => {
                if (typeof value === 'number') {
                  return value.toFixed(2);
                }
                return String(value);
              }}
            />
            {series ? (
              series.map((s, idx) => (
                <Bar
                  key={s.name}
                  name={s.name}
                  dataKey={s.dataKey}
                  fill={s.color || colors[idx % colors.length]}
                />
              ))
            ) : (
              <Bar dataKey="y" fill="#3b82f6" />
            )}
            {series && series.length > 1 && <Legend />}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
              formatter={(value: ValueType, name: NameType) => {
                if (typeof value === 'number') {
                  return value.toFixed(2);
                }
                return String(value);
              }}
            />
            {series ? (
              series.map((s, idx) => (
                <Area
                  key={s.name}
                  type="monotone"
                  name={s.name}
                  dataKey={s.dataKey}
                  stroke={s.color || colors[idx % colors.length]}
                  fill={s.color || colors[idx % colors.length]}
                  fillOpacity={0.3}
                />
              ))
            ) : (
              <Area type="monotone" dataKey="y" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            )}
            {series && series.length > 1 && <Legend />}
          </AreaChart>
        );

      case 'combined':
        // For combined charts, we need to look at series types
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
              formatter={(value: ValueType, name: NameType) => {
                if (typeof value === 'number') {
                  return value.toFixed(2);
                }
                return String(value);
              }}
            />
            {series ? (
              series.map((s, idx) => {
                const color = s.color || colors[idx % colors.length];
                if (s.type === 'scatter') {
                  return (
                    <Line
                      key={s.name}
                      type="monotone"
                      name={s.name}
                      dataKey={s.dataKey}
                      stroke="none"
                      dot={{ fill: color, r: 4 }}
                    />
                  );
                }
                return (
                  <Line
                    key={s.name}
                    type="monotone"
                    name={s.name}
                    dataKey={s.dataKey}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                  />
                );
              })
            ) : (
              <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} dot={false} />
            )}
            {series && series.length > 1 && <Legend />}
          </LineChart>
        );

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
              formatter={(value: ValueType, name: NameType) => {
                if (typeof value === 'number') {
                  return value.toFixed(2);
                }
                return String(value);
              }}
            />
            {series ? (
              series.map((s, idx) => (
                <Line
                  key={s.name}
                  type="monotone"
                  name={s.name}
                  dataKey={s.dataKey}
                  stroke={s.color || colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))
            ) : (
              <>
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} dot={false} />
                {data[0]?.y2 !== undefined && (
                  <Line type="monotone" dataKey="y2" stroke="#ef4444" strokeWidth={2} dot={false} />
                )}
              </>
            )}
            {((series && series.length > 1) || data[0]?.y2 !== undefined) && <Legend />}
          </LineChart>
        );
    }
  };

  return (
    <div className={`graph-renderer ${className}`}>
      {title && (
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}