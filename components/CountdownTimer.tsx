import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../constants/Colors';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
  showAlert?: boolean;
}

export default function CountdownTimer({ targetDate, onComplete, showAlert = true }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });

        // Show alert when 5 minutes remaining
        if (showAlert && days === 0 && hours === 0 && minutes === 5 && seconds === 0) {
          // This would trigger a notification in a real app
          console.log('Event starting in 5 minutes!');
        }
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onComplete?.();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete, showAlert]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.liveText}>LIVE NOW!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event starts in:</Text>
      <View style={styles.timerContainer}>
        {timeLeft.days > 0 && (
          <View style={styles.timeUnit}>
            <Text style={styles.timeValue}>{formatNumber(timeLeft.days)}</Text>
            <Text style={styles.timeLabel}>Days</Text>
          </View>
        )}
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{formatNumber(timeLeft.hours)}</Text>
          <Text style={styles.timeLabel}>Hours</Text>
        </View>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{formatNumber(timeLeft.minutes)}</Text>
          <Text style={styles.timeLabel}>Minutes</Text>
        </View>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{formatNumber(timeLeft.seconds)}</Text>
          <Text style={styles.timeLabel}>Seconds</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 15,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  timeUnit: {
    alignItems: 'center',
    marginHorizontal: 10,
    minWidth: 50,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.starC.primary,
  },
  timeLabel: {
    fontSize: 12,
    color: Colors.starC.textSecondary,
    marginTop: 5,
  },
  liveText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.starC.error,
  },
}); 