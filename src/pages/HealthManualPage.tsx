import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useHealthManualStore } from '../../store/healthManualStore';
import { ManualCategory } from '../../types/health-record';

interface HealthManualPageProps {
  onCategorySelect?: (category: ManualCategory) => void;
}

export const HealthManualPage: React.FC<HealthManualPageProps> = ({
  onCategorySelect,
}) => {
  const { categories, articles, loading, fetchCategories, searchArticles } = useHealthManualStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchArticles(query);
    }
  };

  const handleCategoryPress = (category: ManualCategory) => {
    setSelectedCategory(category.id);
    onCategorySelect?.(category);
  };

  const filteredArticles = selectedCategory
    ? articles.filter((article) => article.categoryId === selectedCategory)
    : articles;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>健康手册</Text>
        <Text style={styles.subtitle}>宠物健康知识库</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索健康知识..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>健康分类</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.categoryCardSelected,
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text style={styles.categoryIcon}>{category.icon || '📋'}</Text>
              <Text style={[
                styles.categoryName,
                selectedCategory === category.id && styles.categoryNameSelected,
              ]}>
                {category.name}
              </Text>
              <Text style={styles.categoryCount}>
                {category.articleCount || 0} 篇
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.articlesContainer}>
        <Text style={styles.sectionTitle}>
          {selectedCategory ? '分类文章' : '推荐文章'}
        </Text>
        {filteredArticles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            onPress={() => {}}
          >
            <View style={styles.articleHeader}>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleDate}>
                {new Date(article.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.articleSummary} numberOfLines={2}>
              {article.summary}
            </Text>
            <View style={styles.articleTags}>
              {article.tags?.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#F97316',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categoryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginLeft: 16,
    width: 120,
    alignItems: 'center',
  },
  categoryCardSelected: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#F97316',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  articlesContainer: {
    padding: 16,
  },
  articleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  articleDate: {
    fontSize: 12,
    color: '#999',
  },
  articleSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  articleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
});
