import 'package:connectivity_plus/connectivity_plus.dart';

class NetworkService {
  static final NetworkService instance = NetworkService._();
  NetworkService._();

  Future<bool> isConnected() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    if (connectivityResult.contains(ConnectivityResult.none)) {
      return false;
    }
    return true;
  }
}
