from django.db import migrations
import csv
import os

def load_data(apps, schema_editor):
    Node = apps.get_model("app", "Node")
    Topic = apps.get_model("app", "Topic")
    Concept = apps.get_model("app", "Concept")
    Relationship = apps.get_model("app", "Relationship")

    base_dir = os.path.dirname(__file__)

    # === Load Nodes (generic) ===
    nodes_path = os.path.join(base_dir, "nodes.csv")
    with open(nodes_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            node_id = int(row["node_id"])
            name = row["node_name"]
            summary = row["node_description"]
            node_type = row["node_type"].lower()

            if node_type == "topic":
                Topic.objects.update_or_create(
                    id=node_id,
                    defaults={"name": name, "summary": summary}
                )
            elif node_type == "concept":
                parent_id = int(row["parent_node_id"]) if row["parent_node_id"] else None
                if parent_id:
                    parent_topic = Topic.objects.get(id=parent_id)
                    Concept.objects.update_or_create(
                        id=node_id,
                        defaults={"name": name, "summary": summary, "related_topic": parent_topic}
                    )
                else:
                    # Fallback: create as plain Node if no topic found
                    Node.objects.update_or_create(
                        id=node_id,
                        defaults={"name": name, "summary": summary}
                    )
            else:
                Node.objects.update_or_create(
                    id=node_id,
                    defaults={"name": name, "summary": summary}
                )

    # === Load Relationships ===
    rels_path = os.path.join(base_dir, "relationships.csv")
    with open(rels_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rel_id = int(row["relationship_id"])
            first_node = Node.objects.get(id=int(row["node_id_1"]))
            second_node = Node.objects.get(id=int(row["node_id_2"]))
            rs_type = row["relationship_type"]

            Relationship.objects.update_or_create(
                id=rel_id,
                defaults={"first_node": first_node, "second_node": second_node, "rs_type": rs_type}
            )

def unload_data(apps, schema_editor):
    Node = apps.get_model("app", "Node")
    Relationship = apps.get_model("app", "Relationship")
    Relationship.objects.all().delete()
    Node.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ("app", "0001_initial"),  # adjust if needed
    ]

    operations = [
        migrations.RunPython(load_data, reverse_code=unload_data),
    ]
