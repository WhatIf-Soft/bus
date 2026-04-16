{{/*
Common labels
*/}}
{{- define "busexpress.labels" -}}
app.kubernetes.io/part-of: busexpress
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{/*
Service image
*/}}
{{- define "busexpress.image" -}}
{{ .global.image.registry }}/{{ .name }}-service:{{ .global.image.tag }}
{{- end }}
