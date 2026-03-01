import React from 'react';
import { View } from 'react-native';
import { Colors } from '../../theme';
import { AttendanceStatus } from '../../types';

interface AttendanceDotProps {
  status: AttendanceStatus;
}

const DOT_COLOR: Record<AttendanceStatus, string> = {
  present: Colors.success,
  absent:  Colors.danger,
  late:    Colors.warning,
};

const AttendanceDot: React.FC<AttendanceDotProps> = ({ status }) => (
  <View
    style={{
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: DOT_COLOR[status],
    }}
  />
);

export default AttendanceDot;
