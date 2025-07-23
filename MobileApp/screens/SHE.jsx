import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


export default function SHEScreen({ navigation }) {
  const [expanded, setExpanded] = useState(null);

  const toggleExpand = (section) => {
    setExpanded(expanded === section ? null : section);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SHE</Text>
        <Text style={styles.Subheader}> (Safety, Health, Environment)</Text>
      </View>

      {/* Safety */}
      <TouchableOpacity style={styles.menuItem} onPress={() => {/* Tambahkan action jika ada */}}>
        <Text style={styles.menuText}>Safety</Text>
        <Ionicons name="chevron-forward" size={20} color="#000" />
      </TouchableOpacity>

      {/* Health */}
      <TouchableOpacity style={[styles.menuItem, expanded === 'Health' && styles.activeMenu]} onPress={() => toggleExpand('Health')}>
        <Text style={styles.menuText}>Health</Text>
        <Ionicons name={expanded === 'Health' ? "chevron-down" : "chevron-forward"} size={20} color="#000" />
      </TouchableOpacity>

      {expanded === 'Health' && (
        <View style={styles.subMenu}>
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => navigation.navigate('HealthRiskAssesmentScreen')}
          >
            <Text style={styles.subMenuText}>Health Risk Assessment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Environment */}
      <TouchableOpacity style={styles.menuItem} onPress={() => {/* Tambahkan action jika ada */}}>
        <Text style={styles.menuText}>Environment</Text>
        <Ionicons name="chevron-forward" size={20} color="#000" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 40,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  activeMenu: {
    backgroundColor: '#eaf3ff',
  },
  menuText: {
    fontSize: 16,
  },
  subMenu: {
    backgroundColor: '#f5faff',
    paddingLeft: 32,
  },
  subMenuItem: {
    paddingVertical: 12,
    paddingRight: 16,
  },
  subMenuText: {
    fontSize: 15,
    color: '#2F80ED',
  },
});
