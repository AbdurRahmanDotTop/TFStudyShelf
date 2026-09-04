import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';

class BackupService {
  static final BackupService instance = BackupService._();
  BackupService._();

  Future<String?> exportData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      final Map<String, dynamic> data = {};

      for (String key in keys) {
        data[key] = prefs.get(key);
      }

      final jsonString = jsonEncode(data);
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/tf_study_shelf_backup.json');
      await file.writeAsString(jsonString);

      return file.path;
    } catch (e) {
      debugPrint('Export error: $e');
      return null;
    }
  }

  Future<bool> importData(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) return false;

      final jsonString = await file.readAsString();
      final Map<String, dynamic> data = jsonDecode(jsonString);
      final prefs = await SharedPreferences.getInstance();

      for (var entry in data.entries) {
        if (entry.value is String) {
          await prefs.setString(entry.key, entry.value);
        } else if (entry.value is int) {
          await prefs.setInt(entry.key, entry.value);
        } else if (entry.value is double) {
          await prefs.setDouble(entry.key, entry.value);
        } else if (entry.value is bool) {
          await prefs.setBool(entry.key, entry.value);
        } else if (entry.value is List) {
          final List<String> list = (entry.value as List).map((e) => e.toString()).toList();
          await prefs.setStringList(entry.key, list);
        }
      }
      return true;
    } catch (e) {
      debugPrint('Import error: $e');
      return false;
    }
  }
}
