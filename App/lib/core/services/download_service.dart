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

  Future<String?> downloadPdf(String bookId, String url, Function(int, int) onReceiveProgress) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final savePath = '${dir.path}/book_$bookId.pdf';
      
      await _dio.download(
        url,
        savePath,
        onReceiveProgress: onReceiveProgress,
      );
      
      try {
        final file = File(savePath);
        final bytes = await file.openRead(0, 5).first;
        final signature = String.fromCharCodes(bytes);
        if (signature != '%PDF-') {
          await file.delete();
          return null;
        }
      } catch (e) {
        return null;
      }
      
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
}
