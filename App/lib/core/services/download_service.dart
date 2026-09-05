import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DownloadService {
  static final DownloadService instance = DownloadService._();
  DownloadService._();

  final Dio _dio = Dio();

  Future<String?> getDownloadedPdfPath(String bookId) async {
    final prefs = await SharedPreferences.getInstance();
    final path = prefs.getString('download_$bookId');
    if (path != null) {
      if (await File(path).exists()) {
        final expiry = prefs.getInt('download_expiry_$bookId') ?? 0;
        if (DateTime.now().millisecondsSinceEpoch < expiry) {
          return path; // Valid and not expired
        } else {
          // Expired, delete it
          try {
            await File(path).delete();
            await prefs.remove('download_$bookId');
            await prefs.remove('download_expiry_$bookId');
          } catch (_) {}
        }
      } else {
        await prefs.remove('download_$bookId');
        await prefs.remove('download_expiry_$bookId');
      }
    }
    return null;
  }

  Future<bool> _downloadAndBypassWarning(String url, String savePath, Function(int, int) onReceiveProgress) async {
    try {
      final response = await _dio.download(
        url,
        savePath,
        onReceiveProgress: onReceiveProgress,
      );
      
      final file = File(savePath);
      if (!await file.exists()) return false;
      
      final bytes = await file.openRead(0, 5).first;
      final signature = String.fromCharCodes(bytes);
      
      if (signature != '%PDF-') {
        // It's not a PDF. Might be a Google Drive virus scan warning page.
        final length = await file.length();
        if (length < 150000) { // < 150KB
          final html = await file.readAsString();
          final match = RegExp(r'confirm=([a-zA-Z0-9_-]+)').firstMatch(html);
          
          if (match != null) {
            final confirmToken = match.group(1)!;
            final newUrl = '$url&confirm=$confirmToken';
            
            final cookies = response.headers['set-cookie'];
            
            await file.delete(); // Delete the HTML file
            
            // Download again with token and cookies
            await _dio.download(
              newUrl,
              savePath,
              onReceiveProgress: onReceiveProgress,
              options: Options(
                headers: {
                  if (cookies != null && cookies.isNotEmpty) 'Cookie': cookies.join('; '),
                },
              ),
            );
            
            // Check signature again
            final newBytes = await file.openRead(0, 5).first;
            final newSignature = String.fromCharCodes(newBytes);
            if (newSignature != '%PDF-') {
              await file.delete();
              return false;
            }
            return true; // Success on second try
          }
        }
        await file.delete();
        return false;
      }
      return true; // Success on first try
    } catch (e) {
      try {
        final file = File(savePath);
        if (await file.exists()) {
          await file.delete();
        }
      } catch (_) {}
      return false;
    }
  }

  Future<String?> downloadPdf(String bookId, String url, Function(int, int) onReceiveProgress) async {
    final dir = await getApplicationDocumentsDirectory();
    final savePath = '${dir.path}/book_$bookId.pdf';
    
    final success = await _downloadAndBypassWarning(url, savePath, onReceiveProgress);
    if (!success) return null;
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('download_$bookId', savePath);
      // Valid for 24 hours
      final expiry = DateTime.now().add(const Duration(hours: 24)).millisecondsSinceEpoch;
      await prefs.setInt('download_expiry_$bookId', expiry);
      return savePath;
    } catch (e) {
      return null;
    }
  }

  Future<String?> downloadPdfOnline(String bookId, String url, Function(int, int) onReceiveProgress) async {
    final dir = await getTemporaryDirectory();
    final savePath = '${dir.path}/temp_book_$bookId.pdf';
    
    final success = await _downloadAndBypassWarning(url, savePath, onReceiveProgress);
    if (!success) return null;
    
    return savePath;
  }

  Future<void> saveOfflineChapters(String bookId, String json) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('offline_chapters_$bookId', json);
    // Valid for 24 hours
    final expiry = DateTime.now().add(const Duration(hours: 24)).millisecondsSinceEpoch;
    await prefs.setInt('offline_chapters_expiry_$bookId', expiry);
  }

  Future<String?> getOfflineChapters(String bookId) async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString('offline_chapters_$bookId');
    if (json != null) {
      final expiry = prefs.getInt('offline_chapters_expiry_$bookId') ?? 0;
      if (DateTime.now().millisecondsSinceEpoch < expiry) {
        return json; // Valid and not expired
      } else {
        // Expired
        await prefs.remove('offline_chapters_$bookId');
        await prefs.remove('offline_chapters_expiry_$bookId');
      }
    }
    return null;
  }
}
