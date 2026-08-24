enum SyncUiStatus {
  offline,
  syncing,
  synced,
  pending,
  error,
}

extension SyncUiStatusLabel on SyncUiStatus {
  String get label {
    switch (this) {
      case SyncUiStatus.offline:
        return 'Hors ligne';
      case SyncUiStatus.syncing:
        return 'Synchronisation…';
      case SyncUiStatus.synced:
        return 'À jour';
      case SyncUiStatus.pending:
        return 'En attente de sync';
      case SyncUiStatus.error:
        return 'Échec sync';
    }
  }
}
