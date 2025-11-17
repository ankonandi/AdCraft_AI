import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Megaphone, Calendar } from "lucide-react";

export default function History() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'description':
        return <FileText className="w-5 h-5 text-primary" />;
      case 'campaign':
        return <Megaphone className="w-5 h-5 text-primary" />;
      default:
        return <Calendar className="w-5 h-5 text-primary" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Activity History</h1>
            <p className="text-muted-foreground">
              View your recent content generations
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No activity yet</p>
                <p className="text-sm text-muted-foreground">
                  Start generating content to see your history here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-soft transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getActivityIcon(activity.activity_type)}
                        <div>
                          <CardTitle className="text-lg">
                            {activity.activity_type === 'description'
                              ? 'Product Description Generated'
                              : 'Marketing Campaign Created'}
                          </CardTitle>
                          <CardDescription>
                            {formatDate(activity.created_at)}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {activity.metadata && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {JSON.stringify(activity.metadata).slice(0, 100)}...
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
