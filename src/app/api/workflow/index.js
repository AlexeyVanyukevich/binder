const { StatusCode } = require("../../../http/response/status-code");

/**
 * @typedef {import('../../../http/server/router').RouterFactory} RouterFactory
 * @typedef {import('../../../workflow').WorkflowSystem} WorkflowSystem
 */

/**
 * Creates the workflow API router.
 * @param {WorkflowSystem} workflowSystem
 * @returns {RouterFactory}
 */
const workflowRouter = (workflowSystem) => {
  const { store, engine, webhookManager } = workflowSystem;

  return (router) => {
    // POST /api/workflow — Create workflow
    router.post("/", async (req, res) => {
      const raw = await req.getBody();
      if (!raw) {
        res.setStatus(StatusCode.BadRequest).json({ error: "Request body is required" });
        return;
      }

      let input;
      try {
        input = JSON.parse(raw.toString("utf-8"));
      } catch (_e) {
        res.setStatus(StatusCode.BadRequest).json({ error: "Invalid JSON" });
        return;
      }

      if (!input.name || !input.nodes || !input.edges) {
        res.setStatus(StatusCode.BadRequest).json({
          error: "name, nodes, and edges are required",
        });
        return;
      }

      const wf = store.createWorkflow(input);
      webhookManager.registerWorkflow(wf);
      res.setStatus(StatusCode.Created).json(wf);
    });

    // GET /api/workflow — List workflows
    router.get("/", async (_req, res) => {
      res.json(store.listWorkflows());
    });

    // GET /api/workflow/executions/:executionId — Get execution
    // Must be registered BEFORE /:id to avoid catch-all match
    router.get("/executions/:executionId", async (req, res) => {
      const execution = store.getExecution(req.params.executionId);
      if (!execution) {
        res.notFound();
        return;
      }
      res.json(execution);
    });

    // GET /api/workflow/:id — Get workflow
    router.get("/:id", async (req, res) => {
      const wf = store.getWorkflow(req.params.id);
      if (!wf) {
        res.notFound();
        return;
      }
      res.json(wf);
    });

    // PUT /api/workflow/:id — Update workflow
    router.put("/:id", async (req, res) => {
      const raw = await req.getBody();
      if (!raw) {
        res.setStatus(StatusCode.BadRequest).json({ error: "Request body is required" });
        return;
      }

      let input;
      try {
        input = JSON.parse(raw.toString("utf-8"));
      } catch (_e) {
        res.setStatus(StatusCode.BadRequest).json({ error: "Invalid JSON" });
        return;
      }

      const existing = store.getWorkflow(req.params.id);
      if (!existing) {
        res.notFound();
        return;
      }

      webhookManager.unregisterWorkflow(req.params.id);
      const updated = store.updateWorkflow(req.params.id, input);
      webhookManager.registerWorkflow(updated);
      res.json(updated);
    });

    // DELETE /api/workflow/:id — Delete workflow
    router.delete("/:id", async (req, res) => {
      const existing = store.getWorkflow(req.params.id);
      if (!existing) {
        res.notFound();
        return;
      }

      webhookManager.unregisterWorkflow(req.params.id);
      store.deleteWorkflow(req.params.id);
      res.sendStatus(StatusCode.NoContent);
    });

    // POST /api/workflow/:id/execute — Trigger execution manually
    router.post("/:id/execute", async (req, res) => {
      const wf = store.getWorkflow(req.params.id);
      if (!wf) {
        res.notFound();
        return;
      }

      let triggerData = {};
      const raw = await req.getBody();
      if (raw) {
        try {
          triggerData = JSON.parse(raw.toString("utf-8"));
        } catch (_e) {
          triggerData = { raw: raw.toString("utf-8") };
        }
      }

      try {
        const execution = await engine.execute(wf, triggerData);
        res.json(execution);
      } catch (err) {
        res
          .setStatus(StatusCode.InternalServerError)
          .json({ error: err.message });
      }
    });

    // GET /api/workflow/:id/executions — List executions for a workflow
    router.get("/:id/executions", async (req, res) => {
      const wf = store.getWorkflow(req.params.id);
      if (!wf) {
        res.notFound();
        return;
      }
      res.json(store.listExecutions(req.params.id));
    });
  };
};

module.exports = { workflowRouter };
