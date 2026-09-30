select cron.alter_job(
  job_id := (select jobid from cron.job where jobname='recuperar-carrinhos'),
  schedule := '*/15 * * * *'
);
