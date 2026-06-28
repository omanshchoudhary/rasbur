import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

let bucket: GridFSBucket | null = null;

function getBucket(): GridFSBucket {
    if (bucket) return bucket;

    const db = mongoose.connection.db;

    if (!db) {
        throw new Error('Database connection is not active yet. Cannot initialize GridFS.');
    }

    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    return bucket;
}

// Returns the ObjectId of the file stored in GridFS
export async function storeFile(
    buffer: Buffer,
    filename: string,
    contentType: string
): Promise<ObjectId> {
    const activeBucket = getBucket();

    // Receives incoming chunks, splits them into GridFS chunks and stores them in MongoDB.
    const uploadStream = activeBucket.openUploadStream(filename, {
        metadata: { contentType },
    });

    // Reads data from a source and emits it in small chunks instead of loading everything at once.
    const readableStream = Readable.from(buffer);

    // Ends after every chunk of data has be read,write and processed by GridFS.
    await pipeline(readableStream, uploadStream);

    return uploadStream.id as ObjectId;
}

export async function getFileBuffer(id: ObjectId): Promise<Buffer> {
    const activeBucket = getBucket();
    // Reads file chunks from GridFS and provides them to your application one by one.
    const downloadStream = activeBucket.openDownloadStream(id);
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

export async function deleteFile(id: ObjectId): Promise<void> {
    const activeBucket = getBucket();

    await activeBucket.delete(id);
}
