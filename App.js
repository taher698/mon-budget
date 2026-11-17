import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mon_budget_transactions_v1';

const CATEGORIES = [
  { id: 'alim', name: 'Alimentation', icon: '🍔', color: '#FF7675' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#74B9FF' },
  { id: 'logement', name: 'Logement & Factures', icon: '🏠', color: '#A29BFE' },
  { id: 'loisirs', name: 'Loisirs & Sorties', icon: '🎮', color: '#FD79A8' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#FDCB6E' },
  { id: 'salaire', name: 'Salaire / Revenus', icon: '💼', color: '#00B894' },
  { id: 'sante', name: 'Santé', icon: '💊', color: '#00CEC9' },
  { id: 'autre', name: 'Autre', icon: '💡', color: '#636E72' },
];

const INITIAL_TRANSACTIONS = [
  {
    id: '1',
    title: 'Salaire mensuel',
    amount: 2400.0,
    type: 'income',
    categoryId: 'salaire',
    date: new Date().toLocaleDateString('fr-FR'),
  },
  {
    id: '2',
    title: 'Courses supermarché',
    amount: 85.5,
    type: 'expense',
    categoryId: 'alim',
    date: new Date().toLocaleDateString('fr-FR'),
  },
  {
    id: '3',
    title: 'Pass Navigo / Essence',
    amount: 75.0,
    type: 'expense',
    categoryId: 'transport',
    date: new Date().toLocaleDateString('fr-FR'),
  },
  {
    id: '4',
    title: 'Restaurant & Sortie',
    amount: 45.0,
    type: 'expense',
    categoryId: 'loisirs',
    date: new Date().toLocaleDateString('fr-FR'),
  },
  {
    id: '5',
    title: 'Facture Électricité / Box',
    amount: 90.0,
    type: 'expense',
    categoryId: 'logement',
    date: new Date().toLocaleDateString('fr-FR'),
  },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard' or 'report'
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'expense', 'income'
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Formulaire d'ajout
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);

  // Charger les transactions
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setTransactions(JSON.parse(saved));
      } else {
        setTransactions(INITIAL_TRANSACTIONS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      }
    } catch (e) {
      setTransactions(INITIAL_TRANSACTIONS);
    }
  };

  const saveTransactions = async (newTransactions) => {
    try {
      setTransactions(newTransactions);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
    } catch (e) {
      console.error('Erreur sauvegarde:', e);
    }
  };

  const handleAddTransaction = () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!title.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir un titre pour la transaction.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Montant invalide', 'Veuillez saisir un montant valide supérieur à 0.');
      return;
    }

    const newTx = {
      id: Date.now().toString(),
      title: title.trim(),
      amount: parsedAmount,
      type: type,
      categoryId: selectedCategory,
      date: new Date().toLocaleDateString('fr-FR'),
    };

    const updated = [newTx, ...transactions];
    saveTransactions(updated);

    // Reset formulaire
    setTitle('');
    setAmount('');
    setType('expense');
    setSelectedCategory(CATEGORIES[0].id);
    setIsModalVisible(false);
  };

  const handleDeleteTransaction = (id) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer cette opération ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const filtered = transactions.filter((tx) => tx.id !== id);
            saveTransactions(filtered);
          },
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Réinitialiser le bilan',
      'Êtes-vous sûr de vouloir supprimer toutes les opérations et repartir à zéro ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout effacer',
          style: 'destructive',
          onPress: () => {
            saveTransactions([]);
          },
        },
      ]
    );
  };

  // Calculs financiers
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const savingsRate = totalIncome > 0
    ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100)
    : 0;

  // Filtrage
  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'expense') return tx.type === 'expense';
    if (activeTab === 'income') return tx.type === 'income';
    return true;
  });

  // Calcul des dépenses par catégorie
  const expensesByCategory = CATEGORIES.map((cat) => {
    const list = transactions.filter((tx) => tx.type === 'expense' && tx.categoryId === cat.id);
    const total = list.reduce((sum, tx) => sum + tx.amount, 0);
    const count = list.length;
    const percentage = totalExpense > 0 ? (total / totalExpense) * 100 : 0;
    return { ...cat, total, count, percentage };
  })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Statistiques rapport
  const expenseCount = transactions.filter((t) => t.type === 'expense').length;
  const incomeCount = transactions.filter((t) => t.type === 'income').length;
  const avgExpense = expenseCount > 0 ? totalExpense / expenseCount : 0;
  const maxExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((max, t) => (t.amount > max.amount ? t : max), { amount: 0, title: 'Aucune' });

  // Rendu de l'écran Dashboard
  const renderDashboard = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* CARTE SOLDE GLOBAL */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde Actuel Net</Text>
        <Text style={[styles.balanceValue, netBalance < 0 && styles.negativeBalance]}>
          {netBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#00B894' }]} />
            <View>
              <Text style={styles.statLabel}>Revenus</Text>
              <Text style={styles.statIncome}>
                +{totalIncome.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#FF7675' }]} />
            <View>
              <Text style={styles.statLabel}>Dépenses</Text>
              <Text style={styles.statExpense}>
                -{totalExpense.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* SECTION RÉPARTITION PAR CATÉGORIE */}
      {expensesByCategory.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Répartition des dépenses</Text>
            <TouchableOpacity onPress={() => setCurrentScreen('report')}>
              <Text style={styles.linkText}>Voir rapport complet ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesCard}>
            {expensesByCategory.slice(0, 4).map((cat) => (
              <View key={cat.id} style={styles.catProgressItem}>
                <View style={styles.catInfoRow}>
                  <Text style={styles.catName}>
                    {cat.icon} {cat.name}
                  </Text>
                  <Text style={styles.catAmount}>
                    {cat.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € ({cat.percentage.toFixed(0)}%)
                  </Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: cat.color,
                        width: `${Math.min(100, Math.max(5, cat.percentage))}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* SECTION HISTORIQUE & FILTRES */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <Text style={styles.txCount}>{filteredTransactions.length} op.</Text>
        </View>

        {/* Onglets Filtres */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.filterText, activeTab === 'all' && styles.filterTextActive]}>
              Toutes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'expense' && styles.filterTabActive]}
            onPress={() => setActiveTab('expense')}
          >
            <Text style={[styles.filterText, activeTab === 'expense' && styles.filterTextActive]}>
              Dépenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'income' && styles.filterTabActive]}
            onPress={() => setActiveTab('income')}
          >
            <Text style={[styles.filterText, activeTab === 'income' && styles.filterTextActive]}>
              Revenus
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste des transactions */}
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>Aucune transaction enregistrée</Text>
          </View>
        ) : (
          filteredTransactions.map((item) => {
            const category = CATEGORIES.find((c) => c.id === item.categoryId) || CATEGORIES[7];
            const isIncome = item.type === 'income';

            return (
              <View key={item.id} style={styles.txItem}>
                <View style={[styles.txIconContainer, { backgroundColor: category.color + '22' }]}>
                  <Text style={styles.txEmoji}>{category.icon}</Text>
                </View>

                <View style={styles.txDetails}>
                  <Text style={styles.txTitle}>{item.title}</Text>
                  <Text style={styles.txMeta}>
                    {category.name} • {item.date}
                  </Text>
                </View>

                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, isIncome ? styles.incomeText : styles.expenseText]}>
                    {isIncome ? '+' : '-'} {item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTransaction(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );

  // Rendu de l'écran Rapport Final
  const renderReport = () => {
    const isDeficit = netBalance < 0;
    const isHealthy = savingsRate >= 20;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* EN-TÊTE RAPPORT */}
        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSubtitle}>SYNTHÈSE GÉNÉRALE</Text>
          <Text style={styles.reportCardTitle}>Bilan Financier Global</Text>

          {/* Comparatif Visuel Barres */}
          <View style={styles.ratioBarContainer}>
            <View
              style={[
                styles.ratioBarIncome,
                {
                  flex: totalIncome > 0 ? totalIncome : 1,
                },
              ]}
            />
            <View
              style={[
                styles.ratioBarExpense,
                {
                  flex: totalExpense > 0 ? totalExpense : 1,
                },
              ]}
            />
          </View>
          <View style={styles.ratioLabelsRow}>
            <Text style={styles.ratioLabelIncome}>
              Revenus : {totalIncome.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </Text>
            <Text style={styles.ratioLabelExpense}>
              Dépenses : {totalExpense.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </Text>
          </View>

          {/* Diagnostic Box */}
          <View
            style={[
              styles.healthBadge,
              isDeficit
                ? styles.healthBadgeRed
                : isHealthy
                ? styles.healthBadgeGreen
                : styles.healthBadgeOrange,
            ]}
          >
            <Text style={styles.healthBadgeEmoji}>
              {isDeficit ? '⚠️' : isHealthy ? '🏆' : '⚖️'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.healthBadgeTitle}>
                {isDeficit
                  ? 'Déficit budgétaire'
                  : isHealthy
                  ? 'Santé financière excellente'
                  : 'Budget équilibré'}
              </Text>
              <Text style={styles.healthBadgeDesc}>
                {isDeficit
                  ? 'Vos dépenses dépassent vos revenus totaux. Pensez à limiter les postes variables.'
                  : isHealthy
                  ? `Félicitations ! Vous parvenez à épargner ${savingsRate.toFixed(1)}% de vos revenus.`
                  : `Vos revenus couvrent vos charges avec un taux d'épargne de ${savingsRate.toFixed(1)}%.`}
              </Text>
            </View>
          </View>
        </View>

        {/* 4 CHIFFRES CLÉS */}
        <Text style={styles.sectionTitle}>Indicateurs Clés</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Résultat Net</Text>
            <Text style={[styles.kpiValue, isDeficit ? styles.negativeBalance : styles.incomeText]}>
              {netBalance >= 0 ? '+' : ''}
              {netBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </Text>
            <Text style={styles.kpiSub}>Épargne disponible</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Taux d'Épargne</Text>
            <Text style={styles.kpiValue}>{savingsRate.toFixed(1)} %</Text>
            <Text style={styles.kpiSub}>Du total revenus</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Dépense Moyenne</Text>
            <Text style={styles.kpiValue}>
              {avgExpense.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </Text>
            <Text style={styles.kpiSub}>Par opération ({expenseCount} dép.)</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Plus Grosse Dépense</Text>
            <Text style={[styles.kpiValue, { color: '#FF7675' }]}>
              {maxExpense.amount > 0 ? `${maxExpense.amount.toLocaleString('fr-FR')} €` : '0 €'}
            </Text>
            <Text style={styles.kpiSub} numberOfLines={1}>
              {maxExpense.title}
            </Text>
          </View>
        </View>

        {/* CLASSEMENT DES DÉPENSES PAR POSTE */}
        <Text style={styles.sectionTitle}>Classement des Postes de Dépense</Text>
        <View style={styles.categoriesCard}>
          {expensesByCategory.length === 0 ? (
            <Text style={styles.emptyText}>Aucune dépense enregistrée</Text>
          ) : (
            expensesByCategory.map((cat, index) => (
              <View key={cat.id} style={styles.rankItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={styles.catInfoRow}>
                    <Text style={styles.catName}>
                      {cat.icon} {cat.name}
                    </Text>
                    <Text style={styles.catAmount}>
                      {cat.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </Text>
                  </View>

                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: cat.color,
                          width: `${Math.min(100, Math.max(5, cat.percentage))}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.rankMeta}>
                    {cat.percentage.toFixed(1)}% des dépenses totales • {cat.count} opération(s)
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* BOUTON RÉINITIALISER */}
        <TouchableOpacity style={styles.resetButton} onPress={handleResetData}>
          <Text style={styles.resetButtonText}>🗑️ Réinitialiser tout le bilan</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* HEADER PRINCIPAL */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Application Mobile</Text>
          <Text style={styles.headerTitle}>Mon Budget</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* BARRE D'ONGLETS NAVIGATION (Dashboard / Rapport) */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navTab, currentScreen === 'dashboard' && styles.navTabActive]}
          onPress={() => setCurrentScreen('dashboard')}
        >
          <Text style={[styles.navTabText, currentScreen === 'dashboard' && styles.navTabTextActive]}>
            🏠 Opérations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, currentScreen === 'report' && styles.navTabActive]}
          onPress={() => setCurrentScreen('report')}
        >
          <Text style={[styles.navTabText, currentScreen === 'report' && styles.navTabTextActive]}>
            📊 Rapport Final
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENU SELON L'ÉCRAN ACTIF */}
      {currentScreen === 'dashboard' ? renderDashboard() : renderReport()}

      {/* MODAL D'AJOUT DE TRANSACTION */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle Opération</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>Fermer</Text>
              </TouchableOpacity>
            </View>

            {/* Type selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && styles.typeButtonExpense]}
                onPress={() => {
                  setType('expense');
                  if (selectedCategory === 'salaire') setSelectedCategory('alim');
                }}
              >
                <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
                  📉 Dépense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && styles.typeButtonIncome]}
                onPress={() => {
                  setType('income');
                  setSelectedCategory('salaire');
                }}
              >
                <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
                  📈 Revenu
                </Text>
              </TouchableOpacity>
            </View>

            {/* Montant */}
            <Text style={styles.inputLabel}>Montant (€)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus={true}
            />

            {/* Titre */}
            <Text style={styles.inputLabel}>Titre ou Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: Facture, Restaurant, Salaire..."
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />

            {/* Choix de Catégorie */}
            <Text style={styles.inputLabel}>Catégorie</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryPicker}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      isSelected && { borderColor: cat.color, backgroundColor: cat.color + '22' },
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={styles.categoryOptionIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryOptionName,
                        isSelected && { color: cat.color, fontWeight: '700' },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Bouton Valider */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.8}
              onPress={handleAddTransaction}
            >
              <Text style={styles.submitButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 15,
    paddingBottom: 15,
    backgroundColor: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  navTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  navTabActive: {
    backgroundColor: '#334155',
  },
  navTabText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  navTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
    marginBottom: 18,
  },
  negativeBalance: {
    color: '#FF7675',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statIncome: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B894',
    marginTop: 2,
  },
  statExpense: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF7675',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#334155',
    marginHorizontal: 10,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  txCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  categoriesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  catProgressItem: {
    marginBottom: 14,
  },
  catInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catName: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  catAmount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  txIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txEmoji: {
    fontSize: 20,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  txMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  incomeText: {
    color: '#00B894',
  },
  expenseText: {
    color: '#FF7675',
  },
  deleteButton: {
    marginTop: 4,
    padding: 2,
  },
  deleteText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  // STYLES DU RAPPORT
  reportSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  reportSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  reportCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 16,
  },
  ratioBarContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  ratioBarIncome: {
    backgroundColor: '#00B894',
  },
  ratioBarExpense: {
    backgroundColor: '#FF7675',
  },
  ratioLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratioLabelIncome: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  ratioLabelExpense: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF7675',
  },
  healthBadge: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  healthBadgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  healthBadgeOrange: {
    backgroundColor: '#FEF3C7',
  },
  healthBadgeRed: {
    backgroundColor: '#FEE2E2',
  },
  healthBadgeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  healthBadgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  healthBadgeDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  rankMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  resetButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  typeButtonExpense: {
    backgroundColor: '#FF7675',
  },
  typeButtonIncome: {
    backgroundColor: '#00B894',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 10,
  },
  amountInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  categoryPicker: {
    flexDirection: 'row',
    marginBottom: 24,
    marginTop: 4,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  categoryOptionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryOptionName: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
