// TF Study Shelf — Content Block Model
import 'dart:convert';

enum BlockType {
  paragraph,
  heading,
  image,
  video,
  pdf,
  unknown
}

abstract class ContentBlock {
  final String id;
  final BlockType type;

  const ContentBlock({required this.id, required this.type});

  factory ContentBlock.fromJson(Map<String, dynamic> json) {
    final typeStr = json['type'] as String?;
    final id = json['id'] as String? ?? DateTime.now().millisecondsSinceEpoch.toString();

    switch (typeStr) {
      case 'paragraph':
        return ParagraphBlock(id: id, content: json['content'] ?? '');
      case 'heading':
        return HeadingBlock(
          id: id,
          content: json['content'] ?? '',
          level: json['level'] ?? 2,
        );
      case 'image':
        return ImageBlock(
          id: id,
          url: json['url'] ?? '',
          alt: json['alt'] ?? '',
        );
      case 'video':
        return VideoBlock(id: id, url: json['url'] ?? '');
      case 'pdf':
        return PdfBlock(id: id, url: json['url'] ?? '');
      default:
        return UnknownBlock(id: id);
    }
  }
}

class ParagraphBlock extends ContentBlock {
  final String content;

  const ParagraphBlock({required super.id, required this.content})
      : super(type: BlockType.paragraph);
}

class HeadingBlock extends ContentBlock {
  final String content;
  final int level;

  const HeadingBlock({
    required super.id,
    required this.content,
    required this.level,
  }) : super(type: BlockType.heading);
}

class ImageBlock extends ContentBlock {
  final String url;
  final String alt;

  const ImageBlock({
    required super.id,
    required this.url,
    this.alt = '',
  }) : super(type: BlockType.image);
}

class VideoBlock extends ContentBlock {
  final String url;

  const VideoBlock({required super.id, required this.url})
      : super(type: BlockType.video);
}

class PdfBlock extends ContentBlock {
  final String url;

  const PdfBlock({required super.id, required this.url})
      : super(type: BlockType.pdf);
}

class UnknownBlock extends ContentBlock {
  const UnknownBlock({required super.id}) : super(type: BlockType.unknown);
}
