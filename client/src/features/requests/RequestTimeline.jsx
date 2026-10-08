import { formatDate } from "@/lib/dates";
const actions = {
  submit: "Request submitted",
  approve: "Request approved",
  reject: "Request rejected",
  cancel: "Request cancelled",
  resubmit: "Request resubmitted",
};
export function RequestTimeline({ request }) {
  return (
    <>
      <h2>Activity timeline</h2>
      <ol className="request-timeline">
        {request.history.map((event, index) => (
          <li key={`${event.at}-${index}`}>
            <h3>{actions[event.action]}</h3>
            <p>
              {event.actorName ??
                (event.actorId === request.learnerId
                  ? (request.learner?.name ?? "Learner")
                  : "Reviewer")}{" "}
              · <time dateTime={event.at}>{formatDate(event.at)}</time>
            </p>
            <p className="preserved-text">{event.reason}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
