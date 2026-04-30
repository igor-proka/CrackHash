package ru.nsu.prokofiev.crackhash.worker.service;

import lombok.extern.slf4j.Slf4j;
import org.paukov.combinatorics3.Generator;
import org.springframework.stereotype.Service;
import ru.nsu.prokofiev.crackhash.worker.model.WorkerTaskRequest;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * Реализация взломщика хэшей MD5.
 * Использует библиотеку комбинаторики для генерации слов итератором.
 */
@Slf4j
@Service
public class Md5HashCracker implements HashCracker {

    /**
     * Основной метод перебора.
     * Делит общее пространство перестановок на части и обрабатывает только свою.
     */
    @Override
    public List<String> crack(WorkerTaskRequest task) {
        List<String> foundWords = new ArrayList<>();
        int partNumber = task.getPartNumber();
        int partCount = task.getPartCount();
        String targetHash = task.getHash();

        List<Character> alphabetList = new ArrayList<>();
        for (char c : task.getAlphabet().toCharArray()) {
            alphabetList.add(c);
        }

        try {
            MessageDigest md = MessageDigest.getInstance("MD5");

            // Перебираем слова разной длины от 1 до maxLength
            for (int length = 1; length <= task.getMaxLength(); length++) {
                // Создаем стрим перестановок с повторениями
                Stream<List<Character>> permutationStream = Generator.permutation(alphabetList)
                        .withRepetitions(length)
                        .stream();

                // Считаем общее кол-во комбинаций для текущей длины
                long totalCombinations = (long) Math.pow(alphabetList.size(), length);
                long chunkSize = totalCombinations / partCount;
                long remainder = totalCombinations % partCount;

                // Остаток распределяем по первым частям, чтобы диапазоны были максимально равными.
                long startIdx = (partNumber - 1) * chunkSize + Math.min(partNumber - 1L, remainder);
                long currentChunkSize = chunkSize + (partNumber <= remainder ? 1 : 0);
                long endIdx = startIdx + currentChunkSize;

                if (currentChunkSize == 0) {
                    continue;
                }

                // Используем .skip() и .limit(), чтобы обрабатывать только свой "кусок"
                Iterable<List<Character>> iterable = permutationStream.skip(startIdx)
                        .limit(endIdx - startIdx)::iterator;

                for (List<Character> chars : iterable) {
                    StringBuilder sb = new StringBuilder();
                    for (Character c : chars) {
                        sb.append(c);
                    }
                    String word = sb.toString();

                    // Считаем MD5 хэш слова
                    md.update(word.getBytes());
                    byte[] digest = md.digest();
                    String generatedHash = bytesToHex(digest);

                    // Проверяем совпадение
                    if (generatedHash.equals(targetHash)) {
                        log.info("Worker #{} found match! {} -> {}", partNumber, word, targetHash);
                        foundWords.add(word);
                    }
                }
            }
        } catch (NoSuchAlgorithmException e) {
            log.error("MD5 Algorithm not found", e);
        }

        return foundWords;
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
