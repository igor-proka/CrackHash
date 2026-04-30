package ru.nsu.prokofiev.crackhash.manager.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.nsu.prokofiev.crackhash.manager.model.CrackRequest;
import ru.nsu.prokofiev.crackhash.manager.model.CrackResponse;
import ru.nsu.prokofiev.crackhash.manager.model.StatusResponse;
import ru.nsu.prokofiev.crackhash.manager.service.ManagerService;

import javax.validation.Valid;

/**
 * REST контроллер для взаимодействия с веб-клиентом.
 */
@CrossOrigin(origins = "*") // Разрешает запросы от React-клиента с другого порта/домена
@RestController
@RequestMapping("/api/hash")
@RequiredArgsConstructor
public class ClientApi {

    private final ManagerService managerService;

    /**
     * Принимает запрос на взлом хэша от клиента.
     */
    @PostMapping("/crack")
    public ResponseEntity<CrackResponse> crackHash(@Valid @RequestBody CrackRequest request) {
        String requestId = managerService.createCrackTask(request);
        return ResponseEntity.ok(new CrackResponse(requestId));
    }

    /**
     * Позволяет клиенту узнать текущий статус задачи и получить результат.
     */
    @GetMapping("/status")
    public ResponseEntity<StatusResponse> getStatus(@RequestParam("requestId") String requestId) {
        return ResponseEntity.ok(managerService.getTaskStatus(requestId));
    }
}
